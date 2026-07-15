import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { extractBotSailorMedia, getBotSailorMessageId } from '@/lib/whatsapp/media'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'
type Obj = Record<string, unknown>

function asObject(value: unknown): Obj | null {
  return value !== null && typeof value === 'object' ? value as Obj : null
}

function parseConversation(value: unknown): Obj[] {
  let parsed = value
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed) } catch { return [] }
  }
  if (Array.isArray(parsed)) return parsed.filter(Boolean) as Obj[]
  const object = asObject(parsed)
  return object ? Object.values(object).filter(Boolean) as Obj[] : []
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Obj
  const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
  if (!phoneNumber) return NextResponse.json({ error: 'phone_number is required' }, { status: 400 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key, botsailor_phone_id')
    .eq('user_id', user.id)
    .single()

  if (!tenant?.botsailor_api_key || !tenant?.botsailor_phone_id) {
    return NextResponse.json({ error: 'BotSailor is not configured' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: unresolved, error: unresolvedError } = await admin
    .from('whatsapp_messages')
    .select('id, raw_payload')
    .eq('phone_number', phoneNumber)
    .is('media_url', null)
    .like('message_text', '#ATTACHMENT:%')
    .limit(100)

  if (unresolvedError) {
    console.error('[whatsapp-media] unresolved query failed:', unresolvedError)
    return NextResponse.json({ error: 'Could not load unresolved media' }, { status: 500 })
  }
  if (!unresolved?.length) return NextResponse.json({ updated: [] })

  const params = new URLSearchParams({
    apiToken: tenant.botsailor_api_key,
    phone_number_id: tenant.botsailor_phone_id,
    phone_number: phoneNumber,
    limit: '500',
    offset: '0',
  })
  const response = await fetch(`${BOTSAILOR_BASE}/whatsapp/get/conversation?${params}`, {
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({})) as Obj
  if (!response.ok || (data.status !== undefined && String(data.status) !== '1')) {
    return NextResponse.json({ error: String(data.message ?? 'BotSailor conversation request failed') }, { status: 502 })
  }

  const conversationById = new Map<string, Obj>()
  for (const message of parseConversation(data.message ?? data.data)) {
    const id = getBotSailorMessageId(message)
    if (id) conversationById.set(id, message)
  }

  const updates: Array<{ id: string; media_url: string }> = []
  for (const row of unresolved) {
    const rawPayload = asObject(row.raw_payload)
    const messageId = rawPayload
      ? String(rawPayload._wa_message_id ?? rawPayload.wa_message_id ?? '')
      : ''
    if (!messageId) continue

    const conversationMessage = conversationById.get(messageId)
    if (!conversationMessage) continue
    const media = extractBotSailorMedia(conversationMessage)
    if (!media) continue

    const { error } = await admin
      .from('whatsapp_messages')
      .update({ media_url: media.url, message_type: media.type })
      .eq('id', row.id)
      .is('media_url', null)
    if (!error) updates.push({ id: row.id, media_url: media.url })
    else console.error('[whatsapp-media] update failed:', row.id, error)
  }

  return NextResponse.json({ updated: updates })
}
