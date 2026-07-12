import { createAdminClient } from '@/lib/supabase/server'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'

export interface SendResult {
  ok: boolean
  status: string
  wa_message_id?: string
  error?: string
  raw: Record<string, unknown>
}

/**
 * Send a WhatsApp text message via BotSailor and record it in whatsapp_messages.
 *
 * Credentials (apiToken / phone_number_id) are passed in by the caller — they
 * must be read from the tenants table at request time, never hardcoded.
 *
 * BotSailor Send API:
 *   POST https://botsailor.com/api/v1/whatsapp/send
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: apiToken=…&phone_number_id=…&message=…&phone_number=…
 *
 * Success: {"status":"1","wa_message_id":"wamid….HB…."}
 * Failure: {"status":"0","message":"…"}
 */
export async function sendWhatsAppMessage(opts: {
  apiKey: string
  phoneId: string
  phoneNumber: string
  message: string
  subscriberId?: string | null
}): Promise<SendResult> {
  const { apiKey, phoneId, phoneNumber, message, subscriberId = null } = opts

  const body = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number: phoneNumber,
    message,
  })

  let data: Record<string, unknown> = {}
  try {
    const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    data = (await res.json()) as Record<string, unknown>
  } catch (err) {
    console.error('[botsailor] send fetch error:', err)
    return { ok: false, status: '0', error: 'Network error calling BotSailor', raw: {} }
  }

  const status = String(data?.status ?? '0')
  if (status !== '1') {
    const errMsg = String(data?.message ?? 'BotSailor send failed')
    console.error('[botsailor] send failed:', errMsg, data)
    return { ok: false, status, error: errMsg, raw: data }
  }

  // Success — insert into whatsapp_messages
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('whatsapp_messages').insert({
      subscriber_id: subscriberId,
      phone_number: phoneNumber,
      sender_name: 'Agent',
      message_text: message,
      message_type: 'text',
      direction: 'outbound',
      raw_payload: data,
    })
    if (error) {
      console.error('[botsailor] whatsapp_messages insert error:', error)
    }
  } catch (err) {
    console.error('[botsailor] whatsapp_messages insert exception:', err)
  }

  return {
    ok: true,
    status,
    wa_message_id: String(data?.wa_message_id ?? ''),
    raw: data,
  }
}
