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

  // Extract readable text from nested message_content (raw WhatsApp webhook JSON string)
  const normalised = messagesArray.map(msg => {
    let text = (msg.message as string) ?? ''

    if (!text && msg.message_content) {
      let mc = msg.message_content
      if (typeof mc === 'string') {
        try { mc = JSON.parse(mc) } catch { /* keep as string */ }
      }
      if (mc && typeof mc === 'object') {
        // Walk the WhatsApp webhook structure to find the message body
        const entry = (mc as Record<string, unknown>)
        const changes = (entry?.entry as Record<string, unknown>[])?.[0]?.changes as Record<string, unknown>[] | undefined
        const value = changes?.[0]?.value as Record<string, unknown> | undefined
        const waMsg = (value?.messages as Record<string, unknown>[])?.[0] as Record<string, unknown> | undefined
        text = (waMsg?.text as Record<string, unknown>)?.body as string
          ?? (waMsg?.button as Record<string, unknown>)?.text as string
          ?? (waMsg?.interactive as Record<string, unknown>)?.body as string
          ?? (mc as Record<string, unknown>)?.text?.toString()
          ?? ''
      } else if (typeof mc === 'string') {
        text = mc
      }
    }

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
