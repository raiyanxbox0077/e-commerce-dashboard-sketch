import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key, botsailor_phone_id')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  const phoneId = tenant?.botsailor_phone_id
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })
  if (!phoneId) return NextResponse.json({ error: 'BotSailor Phone Number ID not configured.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const phoneNumber = searchParams.get('phone_number')
  if (!phoneNumber) return NextResponse.json({ error: 'phone_number required' }, { status: 400 })

  // Get conversation by phone number (subscriber phone number with country code)
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number: phoneNumber,
    limit: '50',
    offset: '0',
  })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/get/conversation?${params}`)
  const data = await res.json()

  // BotSailor returns 200 even on error — check status field
  if (data?.status !== undefined && String(data.status) !== '1') {
    return NextResponse.json(
      { error: data?.message ?? 'Failed to load messages. Check Phone Number ID in Profile > Integrations.' },
      { status: 400 }
    )
  }

  // BotSailor returns message as a JSON string of a numeric-keyed object e.g. {"18":{...},"19":{...}}
  // Parse it and normalise into a clean array for the UI
  let rawMessage = data?.message ?? null
  let messagesArray: Record<string, unknown>[] = []

  if (typeof rawMessage === 'string') {
    try { rawMessage = JSON.parse(rawMessage) } catch { /* not JSON */ }
  }

  if (rawMessage && typeof rawMessage === 'object' && !Array.isArray(rawMessage)) {
    // Numeric-keyed object — convert to array sorted by key
    messagesArray = Object.entries(rawMessage as Record<string, unknown>)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v as Record<string, unknown>)
  } else if (Array.isArray(rawMessage)) {
    messagesArray = rawMessage
  }

  type Obj = Record<string, unknown>
  const asObj = (v: unknown): Obj | null => (v && typeof v === 'object' ? v as Obj : null)
  const str = (v: unknown): string => (typeof v === 'string' ? v : '')

  // Extract display text + type from a single WhatsApp message-like node.
  // Handles both outbound send payloads (bot/agent) and inbound webhook message nodes.
  function extractWaNode(node: Obj): { text: string; type: string } {
    // Plain text
    const textObj = asObj(node.text)
    if (textObj && str(textObj.body)) return { text: str(textObj.body), type: 'text' }
    if (str(node.text)) return { text: str(node.text), type: 'text' }

    // Interactive: outbound prompt has body.text; inbound reply has button_reply/list_reply
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

    // Inbound quick-reply button
    const btn = asObj(node.button)
    if (btn && str(btn.text)) return { text: str(btn.text), type: 'reply' }

    // Media
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
    if (node.template) return { text: '[Template message]', type: 'template' }

    // Generic body/caption fallbacks
    const bodyObj = asObj(node.body)
    if (bodyObj && str(bodyObj.text)) return { text: str(bodyObj.text), type: 'text' }
    if (str(node.body)) return { text: str(node.body), type: 'text' }
    if (str(node.caption)) return { text: str(node.caption), type: 'text' }

    return { text: '', type: 'unknown' }
  }

  // Parse a message_content value (string or object) into { text, type }
  function parseContent(content: unknown): { text: string; type: string } {
    let obj: unknown = content
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj) } catch { return { text: obj, type: 'text' } }
    }
    const o = asObj(obj)
    if (!o) return { text: '', type: 'unknown' }

    // Inbound webhook: entry[0].changes[0].value.messages[0]
    if (o.entry) {
      const entry = (o.entry as Obj[])?.[0]
      const changes = (entry?.changes as Obj[])?.[0]
      const value = asObj(changes?.value)
      const waMsg = asObj((value?.messages as Obj[])?.[0])
      if (waMsg) return extractWaNode(waMsg)
      // Delivery/read status-only webhook — no visible message
      if (value?.statuses) return { text: '', type: 'status' }
      return { text: '', type: 'unknown' }
    }

    // Outbound send payload (bot/agent)
    return extractWaNode(o)
  }

  // Normalise into a clean array for the UI, dropping status-only / empty rows
  const normalised = messagesArray
    .map(msg => {
      const content = msg.message_content ?? msg.message
      const { text, type } = parseContent(content)
      return {
        id: msg.id,
        sender: msg.sender,               // "user" | "bot" | "agent"
        sender_type: msg.sender,
        agent_name: msg.agent_name ?? null,
        message: text,
        msg_type: type,
        created_at: msg.conversation_time ?? msg.created_at,
        status: msg.message_status ?? msg.status ?? null,
      }
    })
    // Drop pure delivery-receipt rows and truly-empty unknowns
    .filter(m => m.message !== '' || (m.msg_type !== 'status' && m.msg_type !== 'unknown'))

  return NextResponse.json({ status: '1', messages: normalised })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key, botsailor_phone_id')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  const phoneId = tenant?.botsailor_phone_id
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })
  if (!phoneId) return NextResponse.json({ error: 'BotSailor Phone Number ID not configured.' }, { status: 400 })

  const body = await req.json()
  const { phone_number, message } = body
  if (!phone_number || !message) return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 })

  // Send text message via BotSailor
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number,
    message,
  })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/send?${params}`, { method: 'GET' })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
