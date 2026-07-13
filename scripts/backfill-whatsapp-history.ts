#!/usr/bin/env node
/**
 * One-time backfill script:
 * Fetches existing WhatsApp conversation history from BotSailor and inserts
 * it into Supabase `whatsapp_messages` so the realtime-driven dashboard
 * has historical chats on first load.
 *
 * Correct contact mapping:
 * - Subscriber list is the source of truth for real names + phone numbers.
 * - `sender_name` is ALWAYS the real subscriber name from the list.
 * - `direction` distinguishes inbound (customer) vs outbound (bot/agent).
 * - `phone_number` is the real customer phone; `whatsapp_bot_subscriber_subscriber_id`
 *   is used as a fallback and parsed as `{phone}-{bot_id}`.
 *
 * Run once with:
 *   SUPABASE_URL=https://iaisgphpjgwmrzkffvgu.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npx tsx scripts/backfill-whatsapp-history.ts
 */

import { createClient } from '@supabase/supabase-js'
import { extractBotSailorMedia, parseAttachmentMarker } from '../lib/whatsapp/media'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'

type Obj = Record<string, unknown>

const asObj = (v: unknown): Obj | null => (v && typeof v === 'object' ? (v as Obj) : null)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function extractWaNode(node: Obj): { text: string; type: string } {
  const textObj = asObj(node.text)
  if (textObj && str(textObj.body)) return { text: str(textObj.body), type: 'text' }
  if (str(node.text)) return { text: str(node.text), type: 'text' }

  const it = asObj(node.interactive)
  if (it) {
    const body = asObj(it.body)
    if (body && str(body.text)) return { text: str(body.text), type: 'interactive' }
    const btnReply = asObj(it.button_reply)
    if (btnReply && str(btnReply.title)) return { text: str(btnReply.title), type: 'reply' }
    const listReply = asObj(it.list_reply)
    if (listReply && str(listReply.title)) return { text: str(listReply.title), type: 'reply' }
    if (it.nfm_reply) return { text: '[Form response]', type: 'reply' }
  }

  const btn = asObj(node.button)
  if (btn && str(btn.text)) return { text: str(btn.text), type: 'reply' }

  const image = asObj(node.image)
  if (image) return { text: str(image.caption) || '[Image]', type: 'image' }
  const video = asObj(node.video)
  if (video) return { text: str(video.caption) || '[Video]', type: 'video' }
  if (node.audio) return { text: '[Voice message]', type: 'audio' }
  const doc = asObj(node.document)
  if (doc) return { text: str(doc.filename) || str(doc.caption) || '[Document]', type: 'document' }
  if (node.sticker) return { text: '[Sticker]', type: 'sticker' }
  if (node.location) return { text: '[Location shared]', type: 'location' }
  if (node.contacts) return { text: '[Contact shared]', type: 'contact' }
  const reaction = asObj(node.reaction)
  if (reaction) return { text: str(reaction.emoji) || '[Reaction]', type: 'reaction' }
  const tmpl = asObj(node.template)
  if (tmpl) return { text: str(tmpl.name) || '[Template message]', type: 'template' }

  const bodyObj = asObj(node.body)
  if (bodyObj && str(bodyObj.text)) return { text: str(bodyObj.text), type: 'text' }
  if (str(node.body)) return { text: str(node.body), type: 'text' }
  if (str(node.caption)) return { text: str(node.caption), type: 'text' }

  return { text: '', type: 'unknown' }
}

function parseContent(content: unknown): { text: string; type: string } {
  let obj: unknown = content
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj) } catch { return { text: obj, type: 'text' } }
  }
  const o = asObj(obj)
  if (!o) return { text: '', type: 'unknown' }

  if (o.entry) {
    const entry = (o.entry as Obj[])?.[0]
    const changes = (entry?.changes as Obj[])?.[0]
    const value = asObj(changes?.value)
    const waMsg = asObj((value?.messages as Obj[])?.[0])
    if (waMsg) return extractWaNode(waMsg)
    if (value?.statuses) return { text: '', type: 'status' }
    return { text: '', type: 'unknown' }
  }

  return extractWaNode(o)
}

interface BotSailorSubscriber {
  subscriber_id?: number | string
  chat_id?: string
  first_name?: string
  last_name?: string
  phone?: string
  whatsapp_bot_subscriber_subscriber_id?: string
}

interface BotSailorMessage {
  id?: string | number
  sender?: string
  sender_type?: string
  message?: unknown
  message_content?: unknown
  conversation_time?: string
  created_at?: string
  whatsapp_bot_subscriber_subscriber_id?: string
  whatsapp_bot_id?: string | number
}

interface Tenant {
  id: string
  botsailor_api_key: string | null
  botsailor_phone_id: string | null
}

interface InsertRow {
  subscriber_id: string | null
  phone_number: string | null
  sender_name: string | null
  message_text: string
  message_type: string
  media_url: string | null
  direction: 'inbound' | 'outbound'
  created_at: string
  raw_payload: Obj
}

async function botSailorRequest<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`BotSailor HTTP error ${res.status}: ${url}`)
    return null
  }
  const data = (await res.json()) as { status?: string | number; message?: unknown }
  if (data.status !== undefined && String(data.status) !== '1') {
    console.error(`BotSailor API error ${data.status}:`, data.message)
    return null
  }
  return data as T
}

function extractPhoneFromSubscriberId(raw?: string | null): string | null {
  if (!raw) return null
  // Format: "{phone_number}-{whatsapp_bot_id}"
  const dashIdx = raw.indexOf('-')
  if (dashIdx > 0) return raw.slice(0, dashIdx)
  return raw
}

async function getSubscribers(apiKey: string, phoneId: string): Promise<BotSailorSubscriber[]> {
  const all: BotSailorSubscriber[] = []
  const limit = 100
  let offset = 0

  while (true) {
    const params = new URLSearchParams({
      apiToken: apiKey,
      phone_number_id: phoneId,
      limit: String(limit),
      offset: String(offset),
      orderBy: '1',
    })
    const data = await botSailorRequest<{ message?: BotSailorSubscriber[] }>(
      `${BOTSAILOR_BASE}/whatsapp/subscriber/list?${params}`
    )
    const batch = Array.isArray(data?.message) ? data.message : []
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }

  return all
}

async function getConversationPage(
  apiKey: string,
  phoneId: string,
  phoneNumber: string,
  offset: number,
  limit: number
): Promise<BotSailorMessage[]> {
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number: phoneNumber,
    limit: String(limit),
    offset: String(offset),
  })
  const data = await botSailorRequest<{ message?: unknown }>(
    `${BOTSAILOR_BASE}/whatsapp/get/conversation?${params}`
  )

  let rawMessage = data?.message ?? null
  let messagesArray: BotSailorMessage[] = []

  if (typeof rawMessage === 'string') {
    try { rawMessage = JSON.parse(rawMessage) } catch { /* not JSON */ }
  }

  if (rawMessage && typeof rawMessage === 'object' && !Array.isArray(rawMessage)) {
    messagesArray = Object.entries(rawMessage as Record<string, unknown>)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v as BotSailorMessage)
  } else if (Array.isArray(rawMessage)) {
    messagesArray = rawMessage
  }

  return messagesArray
}

async function getAllConversation(
  apiKey: string,
  phoneId: string,
  phoneNumber: string
): Promise<BotSailorMessage[]> {
  const all: BotSailorMessage[] = []
  const limit = 200
  let offset = 0

  while (true) {
    const page = await getConversationPage(apiKey, phoneId, phoneNumber, offset, limit)
    if (page.length === 0) break
    all.push(...page)
    if (page.length < limit) break
    offset += limit
  }

  return all
}

function normaliseMessage(
  msg: BotSailorMessage,
  subscriber: BotSailorSubscriber
): InsertRow | null {
  const content = msg.message_content ?? msg.message
  const parsed = parseContent(content)
  const attachment = parseAttachmentMarker(parsed.text)
  const media = extractBotSailorMedia(msg as unknown as Obj)
  const text = parsed.text
  const type = attachment?.type ?? media?.type ?? parsed.type

  // Skip status-only / empty rows
  if (text === '' && (type === 'status' || type === 'unknown')) return null

  const sender = msg.sender ?? msg.sender_type ?? ''
  const isInbound = sender === 'user' || sender === 'subscriber'
  const direction = isInbound ? 'inbound' : 'outbound'

  // Real subscriber name from the subscriber list is the source of truth
  const subscriberName = `${subscriber.first_name ?? ''} ${subscriber.last_name ?? ''}`.trim()
    || subscriber.phone
    || subscriber.chat_id
    || 'Unknown'

  // Real customer phone: prefer subscriber list, fallback to parsing whatsapp_bot_subscriber_subscriber_id
  const phoneFromSubscriberId = extractPhoneFromSubscriberId(
    msg.whatsapp_bot_subscriber_subscriber_id ?? subscriber.whatsapp_bot_subscriber_subscriber_id
  )
  const phoneNumber = subscriber.phone ?? subscriber.chat_id ?? phoneFromSubscriberId

  const ts = msg.conversation_time ?? msg.created_at
  const createdAt = ts ? new Date(ts).toISOString() : new Date().toISOString()

  return {
    subscriber_id: subscriber.subscriber_id ? String(subscriber.subscriber_id) : null,
    phone_number: phoneNumber ?? null,
    sender_name: subscriberName,
    message_text: text,
    message_type: type,
    media_url: media?.url ?? null,
    direction,
    created_at: createdAt,
    raw_payload: msg as unknown as Obj,
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, botsailor_api_key, botsailor_phone_id')

  if (tenantsError) {
    console.error('Failed to fetch tenants:', tenantsError)
    process.exit(1)
  }

  const eligibleTenants = (tenants ?? []).filter(
    (t): t is Tenant => Boolean(t.botsailor_api_key && t.botsailor_phone_id)
  )

  console.log(`Found ${eligibleTenants.length} tenant(s) with BotSailor credentials`)

  let totalInserted = 0
  let totalSkipped = 0
  const distinctPhones = new Set<string>()

  for (const tenant of eligibleTenants) {
    console.log(`\nProcessing tenant ${tenant.id}`)
    const subscribers = await getSubscribers(tenant.botsailor_api_key!, tenant.botsailor_phone_id!)
    console.log(`  ${subscribers.length} subscribers`)

    for (const sub of subscribers) {
      const phoneNumber = sub.phone ?? sub.chat_id
      if (!phoneNumber) {
        console.log('  skipping subscriber with no phone number')
        continue
      }
      distinctPhones.add(phoneNumber)

      const conversation = await getAllConversation(tenant.botsailor_api_key!, tenant.botsailor_phone_id!, phoneNumber)

      const rows: InsertRow[] = []
      for (const msg of conversation) {
        const row = normaliseMessage(msg, sub)
        if (row) rows.push(row)
      }

      if (rows.length === 0) continue

      const { error: insertError } = await supabase.from('whatsapp_messages').insert(rows)
      if (insertError) {
        console.error(`  failed to insert ${rows.length} messages for ${phoneNumber}:`, insertError.message)
        totalSkipped += rows.length
      } else {
        console.log(`  inserted ${rows.length} messages for ${phoneNumber}`)
        totalInserted += rows.length
      }
    }
  }

  console.log(`\nBackfill complete: ${totalInserted} inserted, ${totalSkipped} skipped`)
  console.log(`Distinct real phone numbers: ${distinctPhones.size}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
