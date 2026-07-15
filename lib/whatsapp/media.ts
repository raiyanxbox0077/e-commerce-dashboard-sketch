export type WhatsAppMediaType = 'image' | 'video' | 'audio' | 'document' | 'attachment'

export interface ParsedAttachment {
  type: WhatsAppMediaType
  caption: string
}

type Obj = Record<string, unknown>

const asObject = (value: unknown): Obj | null =>
  value !== null && typeof value === 'object' ? value as Obj : null

const asString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

export function normalizeMediaType(value: string): WhatsAppMediaType {
  const type = value.trim().toLowerCase()
  if (type === 'photo' || type === 'image') return 'image'
  if (type === 'video') return 'video'
  if (type === 'audio' || type === 'voice') return 'audio'
  if (type === 'document' || type === 'file') return 'document'
  return 'attachment'
}

export function parseAttachmentMarker(messageText: string): ParsedAttachment | null {
  const match = messageText.match(/^#ATTACHMENT:([^#]+)#\s*/i)
  if (!match) return null

  return {
    type: normalizeMediaType(match[1]),
    caption: messageText.slice(match[0].length).trim(),
  }
}

function parseJsonObject(value: unknown): Obj | null {
  if (typeof value !== 'string') return asObject(value)
  try {
    return asObject(JSON.parse(value))
  } catch {
    return null
  }
}

function validMediaUrl(value: unknown): string | null {
  const url = asString(value)
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

export function getBotSailorMessageId(message: Obj): string | null {
  return asString(message.wa_message_id) || asString(message.message_id) || null
}

/**
 * Extract a media URL from BotSailor conversation data.
 * Supports direct WhatsApp media nodes and template header components.
 */
export function extractBotSailorMedia(message: Obj): { type: WhatsAppMediaType; url: string } | null {
  const content = parseJsonObject(message.message_content ?? message.message)
  if (!content) return null

  const directType = normalizeMediaType(asString(content.type))
  const directNode = asObject(content[asString(content.type)])
  if (directNode) {
    const directUrl = validMediaUrl(directNode.link) ?? validMediaUrl(directNode.url)
    if (directUrl) return { type: directType, url: directUrl }
  }

  const components = Array.isArray(content.components) ? content.components : []
  for (const componentValue of components) {
    const component = asObject(componentValue)
    if (!component || asString(component.type).toLowerCase() !== 'header') continue

    const type = normalizeMediaType(asString(component.format))
    const example = asObject(component.example)
    const headerUrls = Array.isArray(example?.header_url) ? example.header_url : []
    const headerHandles = Array.isArray(example?.header_handle) ? example.header_handle : []
    const url = validMediaUrl(component.link)
      ?? validMediaUrl(headerUrls[0])
      ?? validMediaUrl(headerHandles[0])

    if (url) return { type, url }
  }

  return null
}
