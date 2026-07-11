import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

function parseWebPayload(payload: Obj): {
  subscriber_id: string | null
  phone_number: string | null
  sender_name: string | null
  message_text: string
  message_type: string
  direction: 'inbound' | 'outbound' | null
  timestamp: string | null
} {
  // Shape 1: Direct BotSailor-normalised payload
  const directSubscriberId = str(payload.subscriber_id)
  const directPhone = str(payload.phone_number) || str(payload.wa_id) || str(payload.from)
  const directName = str(payload.sender_name) || str(payload.name)
  const directMessage = str(payload.message) || str(payload.message_text)
  const directType = str(payload.message_type) || str(payload.type)
  const directDirection = str(payload.direction) as 'inbound' | 'outbound' | null
  const directTs = str(payload.timestamp) || str(payload.created_at)

  if (directPhone && directMessage) {
    return {
      subscriber_id: directSubscriberId || null,
      phone_number: directPhone || null,
      sender_name: directName || null,
      message_text: directMessage,
      message_type: directType || 'text',
      direction: directDirection || 'inbound',
      timestamp: directTs || null,
    }
  }

  // Shape 2: WhatsApp Cloud API / BotSailor raw webhook style
  const entryArr = Array.isArray(payload.entry) ? (payload.entry as Obj[]) : []
  for (const entry of entryArr) {
    const changesArr = Array.isArray(entry.changes) ? (entry.changes as Obj[]) : []
    for (const change of changesArr) {
      const value = asObj(change.value)
      if (!value) continue

      // Status-only webhooks have no visible message
      if (value.statuses) {
        return {
          subscriber_id: null,
          phone_number: null,
          sender_name: null,
          message_text: '',
          message_type: 'status',
          direction: null,
          timestamp: null,
        }
      }

      const messagesArr = Array.isArray(value.messages) ? (value.messages as Obj[]) : []
      const contactsArr = Array.isArray(value.contacts) ? (value.contacts as Obj[]) : []
      const contact = asObj(contactsArr[0])
      const profile = asObj(contact?.profile)
      const senderName = str(profile?.name)

      for (const waMsg of messagesArr) {
        const from = str(waMsg.from)
        const { text, type } = extractWaNode(waMsg)
        return {
          subscriber_id: directSubscriberId || null,
          phone_number: from || directPhone || null,
          sender_name: senderName || directName || null,
          message_text: text,
          message_type: type,
          direction: 'inbound',
          timestamp: str(waMsg.timestamp) || directTs || null,
        }
      }
    }
  }

  // Fallback: try top-level message object
  const msg = asObj(payload.message)
  if (msg) {
    const { text, type } = extractWaNode(msg)
    if (text) {
      return {
        subscriber_id: directSubscriberId || null,
        phone_number: directPhone || null,
        sender_name: directName || null,
        message_text: text,
        message_type: type,
        direction: (str(payload.direction) as 'inbound' | 'outbound') || 'inbound',
        timestamp: directTs || null,
      }
    }
  }

  return {
    subscriber_id: null,
    phone_number: null,
    sender_name: null,
    message_text: '',
    message_type: 'unknown',
    direction: null,
    timestamp: null,
  }
}

export async function POST(req: Request) {
  try {
    let payload: Obj = {}
    try {
      const body = await req.json()
      payload = asObj(body) ?? {}
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = parseWebPayload(payload)

    // Skip status-only webhooks
    if (parsed.message_type === 'status' || (!parsed.phone_number && !parsed.subscriber_id)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (!parsed.message_text) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'empty message' })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('whatsapp_messages').insert({
      subscriber_id: parsed.subscriber_id,
      phone_number: parsed.phone_number,
      sender_name: parsed.sender_name,
      message_text: parsed.message_text,
      message_type: parsed.message_type,
      direction: parsed.direction,
      created_at: parsed.timestamp ? new Date(Number(parsed.timestamp) * 1000).toISOString() : new Date().toISOString(),
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
