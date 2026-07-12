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
    // BotSailor's REAL outgoing-webhook payload (confirmed from live logs):
    //   {
    //     "whatsapp_bot_name": "Oramax",
    //     "whatsapp_bot_id": 425928,
    //     "subscriber_id": "919870209779-425928",
    //     "wa_message_id": "wamid.HBgM…",
    //     "label_names": "",
    //     "first_name": "Raiyan Patel",
    //     "chat_id": "919870209779",
    //     "user_message": "Hello",
    //     "whatsapp_bot_username": "+91 90821 45528"
    //   }
    //
    // Field mappings (BotSailor → whatsapp_messages):
    //   phone_number  ← chat_id
    //   message_text  ← user_message
    //   sender_name   ← first_name
    //   subscriber_id ← subscriber_id (as-is, e.g. "919870209779-425928")
    //   direction     ← hardcoded 'outbound' (BotSailor doesn't send this)
    //   message_type  ← hardcoded 'text' (BotSailor doesn't send this)
    //   raw_payload   ← full original JSON body as-is
    const subscriberId = str(payload.subscriber_id) || null
    const phoneNumber = str(payload.chat_id)
    const messageText = str(payload.user_message)
    const senderName = str(payload.first_name) || null
    const messageType = 'text'
    const direction = 'outbound'

    if (!phoneNumber) {
      console.log('[whatsapp-webhook] missing chat_id, skipping')
      return NextResponse.json({ ok: true, skipped: true, reason: 'missing chat_id' })
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

