import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Obj = Record<string, unknown>
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Normalize a phone number to digits-only with country code, no +, no
 * spaces, no dashes (e.g. "919870209779").  Strips everything non-digit.
 * If the number starts with a single leading 0 (local format without
 * country code) we can't reliably infer the country code, so we leave it
 * as-is (digits-only) — BotSailor already sends with country code.
 */
function normalizePhone(input: string): string {
  let p = input.replace(/[^\d]/g, '') // digits only
  // Remove a single leading 0 — but only if there are more than 10 digits
  // after it (i.e. it was a domestic prefix, not part of the number itself).
  if (p.length > 10 && p.startsWith('0')) p = p.slice(1)
  return p
}

/**
 * Infer a message type from the content of user_message for incoming
 * payloads that lack an explicit message_type field.
 * BotSailor sometimes sends media as a URL in user_message.
 */
function inferMessageType(text: string): string {
  const lower = text.toLowerCase().trim()
  // Only treat as media if the entire message IS a URL (very short text
  // around it would be a caption, not just a URL).
  if (/^https?:\/\/\S+\.(jpg|jpeg|png|webp|gif)(\?\S*)?$/i.test(lower)) return 'image'
  if (/^https?:\/\/\S+\.(pdf|doc|docx)(\?\S*)?$/i.test(lower)) return 'document'
  if (/^https?:\/\/\S+\.(mp3|ogg|m4a|aac|opus)(\?\S*)?$/i.test(lower)) return 'audio'
  if (/^https?:\/\/\S+\.(mp4|mov|avi|webm)(\?\S*)?$/i.test(lower)) return 'video'
  return 'text'
}

const MAX_MESSAGE_LEN = 4000

export async function POST(req: Request) {
  // The entire handler is wrapped so no error ever escapes as a non-200.
  try {
    // ── Read & log the raw body ──────────────────────────────────────
    let rawText = ''
    try {
      rawText = await req.text()
    } catch {
      rawText = '[unreadable body]'
    }
    console.log('[whatsapp-webhook] raw body:', rawText)

    // ── Parse JSON ───────────────────────────────────────────────────
    let payload: Obj = {}
    try {
      payload = JSON.parse(rawText)
      if (!payload || typeof payload !== 'object') payload = {}
    } catch {
      console.log('[whatsapp-webhook] body is not valid JSON, skipping')
      // No raw_log table exists; console is our audit trail.
      return NextResponse.json({ ok: true, skipped: true, reason: 'invalid JSON' })
    }
    console.log('[whatsapp-webhook] parsed payload:', JSON.stringify(payload))

    // ── Shape detection ─────────────────────────────────────────────
    // 1. INCOMING (relayed via n8n): chat_id + user_message
    // 2. OUTBOUND (direct from BotSailor): whatsapp_number + message_text
    const hasIncomingShape = Boolean(str(payload.chat_id)) && Boolean(str(payload.user_message))
    const hasOutboundShape = Boolean(str(payload.whatsapp_number)) && Boolean(str(payload.message_text))

    if (!hasIncomingShape && !hasOutboundShape) {
      console.warn('[whatsapp-webhook] UNKNOWN_PAYLOAD_SHAPE:', JSON.stringify(payload))
      return NextResponse.json({ ok: true, skipped: true, reason: 'unknown_payload_shape' })
    }

    // ── wa_message_id for duplicate prevention ──────────────────────
    const waMessageId = str(payload.wa_message_id) || null
    const rawPayloadForInsert: Obj = { ...payload }
    if (waMessageId) rawPayloadForInsert._wa_message_id = waMessageId

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

    // ── Build the insert row ────────────────────────────────────────
    let insertRow: Record<string, unknown>

    if (hasIncomingShape) {
      // ── INCOMING shape (relayed via n8n) ──
      const rawMessage = str(payload.user_message)
      const trimmedMessage = rawMessage.trim()
      const phoneNumber = normalizePhone(str(payload.chat_id))

      // Empty message guard — skip insert but still return 200.
      if (!trimmedMessage || !phoneNumber) {
        console.log('[whatsapp-webhook] incoming: empty message or phone, skipping')
        return NextResponse.json({ ok: true, skipped: true, reason: 'empty message or phone' })
      }

      const messageType = inferMessageType(trimmedMessage)
      const truncatedMessage = trimmedMessage.length > MAX_MESSAGE_LEN
        ? trimmedMessage.slice(0, MAX_MESSAGE_LEN)
        : trimmedMessage

      insertRow = {
        subscriber_id: str(payload.subscriber_id) || null,
        phone_number: phoneNumber,
        sender_name: str(payload.first_name) || null,
        message_text: truncatedMessage,
        message_type: messageType,
        direction: 'inbound',
        created_at: new Date().toISOString(),
        raw_payload: rawPayloadForInsert,
      }
      console.log('[whatsapp-webhook] incoming:', insertRow.phone_number, '→', trimmedMessage.slice(0, 60))
    } else {
      // ── OUTBOUND shape (direct from BotSailor) ──
      const rawDirection = str(payload.direction)
      const direction = rawDirection === 'incoming' ? 'inbound' : 'outbound'
      const time = str(payload.time)
      const rawMessage = str(payload.message_text)
      const trimmedMessage = rawMessage.trim()
      const phoneNumber = normalizePhone(str(payload.whatsapp_number))

      // Empty message guard
      if (!trimmedMessage || !phoneNumber) {
        console.log('[whatsapp-webhook] outbound: empty message or phone, skipping')
        return NextResponse.json({ ok: true, skipped: true, reason: 'empty message or phone' })
      }

      const truncatedMessage = trimmedMessage.length > MAX_MESSAGE_LEN
        ? trimmedMessage.slice(0, MAX_MESSAGE_LEN)
        : trimmedMessage

      insertRow = {
        subscriber_id: str(payload.subscriber_id) || null,
        phone_number: phoneNumber,
        sender_name: direction === 'outbound' ? 'Agent' : (str(payload.first_name) || null),
        message_text: truncatedMessage,
        message_type: str(payload.message_type) || 'text',
        direction,
        created_at: time ? new Date(time).toISOString() : new Date().toISOString(),
        raw_payload: rawPayloadForInsert,
      }
      console.log('[whatsapp-webhook] outbound:', insertRow.phone_number, '→', trimmedMessage.slice(0, 60))
    }

    // ── Insert into whatsapp_messages ────────────────────────────────
    try {
      const admin = createAdminClient()
      const { error } = await admin.from('whatsapp_messages').insert(insertRow)
      if (error) {
        console.error('[whatsapp-webhook] insert error:', error)
      }
    } catch (insertErr) {
      console.error('[whatsapp-webhook] insert exception:', insertErr)
    }

    // Always return 200.
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Top-level safety net — nothing ever escapes as non-200.
    console.error('[whatsapp-webhook] FATAL unexpected error:', err)
    return NextResponse.json({ ok: true })
  }
}