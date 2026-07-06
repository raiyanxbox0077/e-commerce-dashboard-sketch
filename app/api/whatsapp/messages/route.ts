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

  // Recursively extract text from any nested object/string structure
  function extractText(val: unknown): string {
    if (!val) return ''
    if (typeof val === 'string') {
      // Try to parse JSON strings one level deep
      try {
        const parsed = JSON.parse(val)
        return extractText(parsed)
      } catch { return val }
    }
    if (typeof val !== 'object') return String(val)
    const obj = val as Record<string, unknown>
    // WhatsApp webhook structure: entry[0].changes[0].value.messages[0].text.body
    if (obj.entry) {
      const changes = (obj.entry as Record<string, unknown>[])?.[0]?.changes as Record<string, unknown>[] | undefined
      const value = changes?.[0]?.value as Record<string, unknown> | undefined
      const waMsg = (value?.messages as Record<string, unknown>[])?.[0] as Record<string, unknown> | undefined
      if (waMsg) {
        return (waMsg.text as Record<string, unknown>)?.body as string
          ?? (waMsg.button as Record<string, unknown>)?.text as string
          ?? (waMsg.interactive as Record<string, unknown>)?.body as string
          ?? ''
      }
    }
    // BotSailor bot message: { text: "...", type: "text" } or { body: "..." }
    if (typeof obj.text === 'string') return obj.text
    if (typeof obj.body === 'string') return obj.body
    if (typeof obj.caption === 'string') return obj.caption
    // Nested text object: { text: { body: "..." } }
    if (obj.text && typeof obj.text === 'object') return (obj.text as Record<string, unknown>).body as string ?? ''
    // Last resort: first string value found
    for (const v of Object.values(obj)) {
      if (typeof v === 'string' && v.length > 0) return v
    }
    return ''
  }

  // Normalise into a clean array for the UI
  const normalised = messagesArray.map(msg => {
    // msg.message may be a string or an object depending on sender type
    const raw = msg.message ?? msg.message_content
    const text = extractText(raw)

    return {
      id: msg.id,
      sender: msg.sender,           // "user" | "bot" | "agent"
      sender_type: msg.sender,
      message: text,
      created_at: msg.conversation_time ?? msg.created_at,
      status: msg.status,
    }
  })

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
