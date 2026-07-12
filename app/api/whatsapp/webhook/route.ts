import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Obj = Record<string, unknown>
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export async function POST(req: Request) {
  // Read the raw body as text first so we can log it regardless of whether
  // it parses as JSON.  This log is the single source of truth for debugging
  // delivery issues.
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
    console.log('[whatsapp-webhook] body is not valid JSON, skipping')
    return NextResponse.json({ ok: true, skipped: true, reason: 'invalid JSON' })
  }
  console.log('[whatsapp-webhook] parsed payload:', JSON.stringify(payload))

  try {
    // ── Shape detection ──────────────────────────────────────────────
    //
    // Two payload shapes can arrive at this endpoint:
    //
    // 1. INCOMING (relayed via n8n from BotSailor):
    //    Has "chat_id" AND "user_message".  These are messages sent BY the
    //    customer TO the WhatsApp bot.  n8n intercepts them and forwards
    //    the BotSailor payload as-is.
    //
    // 2. OUTBOUND (direct from BotSailor):
    //    Has "whatsapp_number" AND "message_text".  These are messages sent
    //    BY the bot/agent TO the customer.  BotSailor delivers these directly.
    //
    const hasIncomingShape = Boolean(str(payload.chat_id)) && Boolean(str(payload.user_message))
    const hasOutboundShape = Boolean(str(payload.whatsapp_number)) && Boolean(str(payload.message_text))

    if (!hasIncomingShape && !hasOutboundShape) {
      console.log('[whatsapp-webhook] unrecognized payload shape, skipping')
      return NextResponse.json({ ok: true, skipped: true, reason: 'unrecognized shape' })
    }

    // ── Common fields ────────────────────────────────────────────────
    const waMessageId = str(payload.wa_message_id) || null
    const rawPayloadForInsert: Obj = { ...payload }
    if (waMessageId) rawPayloadForInsert._wa_message_id = waMessageId

    // ── Duplicate prevention via wa_message_id ──────────────────────
    // If the payload carries a wa_message_id, check whether we already
    // stored a row for it.  This is more reliable than time+text matching
    // because incoming payloads have no timestamp field at all.
    if (waMessageId) {
      try {
        const admin = createAdminClient()
        const { data: existing } = await admin
          .from('whatsapp_messages')
          .select('id')
          .contains('raw_payload', { _wa_message_id: waMessageId })
          .limit(1)
        if (existing && existing.length > 0) {
          console.log('[whatsapp-webhook] duplicate wa_message_id, skipping:', waMessageId)
          return NextResponse.json({ ok: true, skipped: true, reason: 'duplicate' })
        }
      } catch (dupErr) {
        console.error('[whatsapp-webhook] duplicate check failed:', dupErr)
      }
    }

    // ── Build the insert row based on shape ─────────────────────────
    let insertRow: Record<string, unknown>

    if (hasIncomingShape) {
      // INCOMING shape (relayed via n8n)
      insertRow = {
        subscriber_id: str(payload.subscriber_id) || null,
        phone_number: str(payload.chat_id),
        sender_name: str(payload.first_name) || null,
        message_text: str(payload.user_message),
        message_type: 'text',
        direction: 'inbound',
        created_at: new Date().toISOString(),
        raw_payload: rawPayloadForInsert,
      }
      console.log('[whatsapp-webhook] incoming message:', insertRow.phone_number, '→', insertRow.message_text)
    } else {
      // OUTBOUND shape (direct from BotSailor)
      const rawDirection = str(payload.direction)
      const direction = rawDirection === 'incoming' ? 'inbound' : 'outbound'
      const time = str(payload.time)
      insertRow = {
        subscriber_id: str(payload.subscriber_id) || null,
        phone_number: str(payload.whatsapp_number),
        sender_name: direction === 'outbound' ? 'Agent' : null,
        message_text: str(payload.message_text),
        message_type: str(payload.message_type) || 'text',
        direction,
        created_at: time ? new Date(time).toISOString() : new Date().toISOString(),
        raw_payload: rawPayloadForInsert,
      }
      console.log('[whatsapp-webhook] outbound message:', insertRow.phone_number, '→', insertRow.message_text)
    }

    if (!str(insertRow.phone_number)) {
      console.log('[whatsapp-webhook] no phone_number after mapping, skipping')
      return NextResponse.json({ ok: true, skipped: true, reason: 'no phone_number' })
    }

    // ── Insert into whatsapp_messages ───────────────────────────────
    // Wrapped in try/catch so a Supabase failure never blocks the 200
    // response BotSailor expects.
    try {
      const admin = createAdminClient()
      const { error } = await admin.from('whatsapp_messages').insert(insertRow)
      if (error) {
        console.error('[whatsapp-webhook] insert error:', error)
      }
    } catch (insertErr) {
      console.error('[whatsapp-webhook] insert exception:', insertErr)
    }

    // Always return 200 — a slow/failing webhook response can cause
    // BotSailor/n8n to stop retrying or mark the URL unhealthy.
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp-webhook] unexpected error:', err)
    return NextResponse.json({ ok: true })
  }
}