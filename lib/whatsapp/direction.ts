type BotSailorMessage = {
  wa_message_id?: unknown
  sender?: unknown
  sender_type?: unknown
}

export type WhatsAppDirection = 'inbound' | 'outbound'

export function directionFromBotSailorSender(sender: unknown): WhatsAppDirection | null {
  const normalized = typeof sender === 'string' ? sender.trim().toLowerCase() : ''
  if (normalized === 'user' || normalized === 'subscriber' || normalized === 'customer') return 'inbound'
  if (normalized === 'bot' || normalized === 'agent' || normalized === 'admin') return 'outbound'
  return null
}

export function directionFromBotSailorMessage(message: BotSailorMessage | null): WhatsAppDirection | null {
  if (!message) return null
  return directionFromBotSailorSender(message.sender ?? message.sender_type)
}

function conversationRows(value: unknown): BotSailorMessage[] {
  let parsed = value
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return []
    }
  }

  if (Array.isArray(parsed)) return parsed.filter((row): row is BotSailorMessage => Boolean(row && typeof row === 'object'))
  if (parsed && typeof parsed === 'object') return Object.values(parsed).filter((row): row is BotSailorMessage => Boolean(row && typeof row === 'object'))
  return []
}

export function findDirectionByWaMessageId(value: unknown, waMessageId: string): WhatsAppDirection | null {
  const match = conversationRows(value).find(message => message.wa_message_id === waMessageId)
  return directionFromBotSailorMessage(match ?? null)
}

/**
 * Resolve an ambiguous n8n relay using BotSailor's authoritative conversation
 * sender. The relay payload itself does not contain direction.
 */
export async function resolveRelayedMessageDirection(options: {
  apiKey: string
  phoneId: string
  phoneNumber: string
  waMessageId: string
}): Promise<WhatsAppDirection | null> {
  const params = new URLSearchParams({
    apiToken: options.apiKey,
    phone_number_id: options.phoneId,
    phone_number: options.phoneNumber,
    limit: '100',
    offset: '0',
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch(`https://botsailor.com/api/v1/whatsapp/get/conversation?${params}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return null

    const payload = await response.json() as { message?: unknown }
    return findDirectionByWaMessageId(payload.message, options.waMessageId)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
