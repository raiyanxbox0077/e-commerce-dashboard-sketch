import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Obj = Record<string, unknown>
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export async function POST(req: Request) {
  try {
    let payload: Obj = {}
    try {
      const body = await req.json()
      payload = (body && typeof body === 'object' ? body : {}) as Obj
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // BotSailor's real outbound-webhook payload shape:
    // {
    //   "subscriber_id": "647291a8c3d9b40012f3e5b6",
    //   "whatsapp_number": "14155552671",
    //   "message_text": "Hello, I need help with my order",
    //   "message_type": "text",
    //   "direction": "incoming",
    //   "time": "2026-07-12T18:23:45Z"
    // }
    const subscriberId = str(payload.subscriber_id) || null
    const phoneNumber = str(payload.whatsapp_number) || null
    const messageText = str(payload.message_text)
    const messageType = str(payload.message_type) || 'text'
    const rawDirection = str(payload.direction)
    const time = str(payload.time)

    // Map BotSailor direction values to our internal values
    const direction = rawDirection === 'incoming' ? 'inbound' : 'outbound'

    // BotSailor does not send sender_name. For outgoing messages we label as Agent;
    // for incoming we leave null (real name can be resolved from subscriber_id later).
    const senderName = direction === 'outbound' ? 'Agent' : null

    if (!phoneNumber || !subscriberId || !messageText) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'missing required fields' })
    }

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
      console.error('Webhook insert error:', error)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
