import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Obj = Record<string, unknown>
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export async function POST(req: Request) {
  // Read the raw body as text first so we can log it regardless of whether
  // it parses as JSON.  BotSailor's docs may differ from the real payload —
  // this log is the single source of truth for debugging delivery issues.
  let rawText = ''
  try {
    rawText = await req.text()
  } catch {
    rawText = '[unreadable body]'
  }
  console.log('[whatsapp-webhook] raw body:', rawText)

  let payload: Obj = {}
  try {
    payload = JSON.parse(rawText)
    if (!payload || typeof payload !== 'object') payload = {}
  } catch {
    // Can't parse — still return 200 so BotSailor doesn't mark the URL unhealthy.
    console.log('[whatsapp-webhook] body is not valid JSON, skipping')
    return NextResponse.json({ ok: true, skipped: true, reason: 'invalid JSON' })
  }
  console.log('[whatsapp-webhook] parsed payload:', JSON.stringify(payload))

  try {
    // BotSailor payload:
    //   subscriber_id  – string
    //   whatsapp_number – recipient phone (digits, country code, no +)
    //   message_text    – the message body
    //   message_type    – text|image|document|video|audio|location
    //   direction       – "incoming" | "outgoing"
    //   time            – ISO-8601 timestamp
    const subscriberId = str(payload.subscriber_id) || null
    const phoneNumber = str(payload.whatsapp_number) || null
    const messageText = str(payload.message_text)
    const messageType = str(payload.message_type) || 'text'
    const rawDirection = str(payload.direction)
    const time = str(payload.time)

    // Map BotSailor direction values to our internal DB convention.
    // Main uses inbound/outbound in the DB (mapped from BotSailor's incoming/outgoing).
    const direction = rawDirection === 'incoming' ? 'inbound' : 'outbound'

    // BotSailor does not send sender_name.  For outgoing messages we label
    // as Agent; for incoming we leave null.
    const senderName = direction === 'outbound' ? 'Agent' : null

    if (!phoneNumber || !messageText) {
      console.log('[whatsapp-webhook] missing required fields, skipping')
      return NextResponse.json({ ok: true, skipped: true, reason: 'missing required fields' })
    }

    // Insert into whatsapp_messages — wrapped in try/catch so a Supabase
    // failure never blocks the 200 response BotSailor expects.
    try {
      const admin = createAdminClient()
      const { error } = await admin.from('whatsapp_messages').insert({
        subscriber_id: subscriberId,
        phone_number: phoneNumber,
        sender_name: senderName,
        message_text: messageText,
        message_type: messageType,
        direction,
        created_at: time ? new Date(time).toISOString() : new Date().toISOString(),
        raw_payload: payload,
      })
      if (error) {
        console.error('[whatsapp-webhook] insert error:', error)
      }
    } catch (insertErr) {
      console.error('[whatsapp-webhook] insert exception:', insertErr)
    }

    // Always return 200 — a slow/failing webhook response can cause BotSailor
    // to stop retrying or mark the URL unhealthy.
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp-webhook] unexpected error:', err)
    return NextResponse.json({ ok: true })
  }
}

