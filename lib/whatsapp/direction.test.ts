import assert from 'node:assert/strict'
import test from 'node:test'

import { directionFromBotSailorMessage, findDirectionByWaMessageId } from './direction'

test('maps BotSailor bot sender to outbound', () => {
  assert.equal(directionFromBotSailorMessage({ sender: 'bot' }), 'outbound')
  assert.equal(directionFromBotSailorMessage({ sender: 'agent' }), 'outbound')
})

test('maps BotSailor user sender to inbound', () => {
  assert.equal(directionFromBotSailorMessage({ sender: 'user' }), 'inbound')
  assert.equal(directionFromBotSailorMessage({ sender_type: 'customer' }), 'inbound')
})

test('uses exact wa_message_id and ignores unrelated records', () => {
  const messages = [
    { wa_message_id: 'customer-id', sender: 'user' },
    { wa_message_id: 'button-relay-id', sender: 'bot' },
  ]

  assert.equal(findDirectionByWaMessageId(messages, 'button-relay-id'), 'outbound')
  assert.equal(findDirectionByWaMessageId(messages, 'missing-id'), null)
})

test('does not guess direction from unknown sender metadata', () => {
  assert.equal(directionFromBotSailorMessage({ sender: 'unknown' }), null)
  assert.equal(directionFromBotSailorMessage(null), null)
})
