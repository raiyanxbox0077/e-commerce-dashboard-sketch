import assert from 'node:assert/strict'
import test from 'node:test'
import { extractBotSailorMedia, getBotSailorMessageId, parseAttachmentMarker } from './media'

test('parses a generic attachment marker and preserves its caption', () => {
  assert.deepEqual(
    parseAttachmentMarker('#ATTACHMENT:Photo# Pullover Hoodie in white'),
    { type: 'image', caption: 'Pullover Hoodie in white' }
  )
})

test('extracts a direct image link from BotSailor conversation content', () => {
  const message = {
    wa_message_id: 'wamid.direct',
    message_content: JSON.stringify({
      type: 'image',
      image: { link: 'https://cdn.example.com/direct-image.jpg' },
    }),
  }

  assert.equal(getBotSailorMessageId(message), 'wamid.direct')
  assert.deepEqual(extractBotSailorMedia(message), {
    type: 'image',
    url: 'https://cdn.example.com/direct-image.jpg',
  })
})

test('extracts a template header image link used by BotSailor media sends', () => {
  const message = {
    wa_message_id: 'wamid.template',
    message_content: {
      name: 'product_image',
      components: [
        {
          type: 'header',
          format: 'IMAGE',
          link: 'https://cdn.example.com/template-image.jpg',
        },
      ],
    },
  }

  assert.deepEqual(extractBotSailorMedia(message), {
    type: 'image',
    url: 'https://cdn.example.com/template-image.jpg',
  })
})

test('rejects unsafe media URL protocols', () => {
  assert.equal(extractBotSailorMedia({
    message_content: {
      type: 'image',
      image: { link: 'javascript:alert(1)' },
    },
  }), null)
})
