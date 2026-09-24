// Run: npx tsx --test test/handler.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker, { errorCode, parseBody } from '../src/index'

test('parseBody accepts a small conversation and rejects anything else', () => {
  assert.deepEqual(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], lang: 'en' })), { messages: [{ role: 'user', content: 'hi' }], lang: 'en' })
  assert.equal(parseBody('not json'), null)
  assert.equal(parseBody(JSON.stringify({ messages: [], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'system', content: 'x' }], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(1001) }], lang: 'en' })), null)
  assert.equal(parseBody(JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], lang: 'ja' })), null)
})

test('keeps only the last 8 messages', () => {
  const messages = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `${i}` }))
  messages.push({ role: 'user', content: 'last' })
  assert.equal(parseBody(JSON.stringify({ messages, lang: 'th' }))!.messages.length, 8)
})

test('a used-up daily allowance is "quota", anything else "upstream"', () => {
  assert.equal(errorCode(new Error('4006: you have used up your daily free allocation of 10,000 neurons')), 'quota')
  assert.equal(errorCode(new Error('socket hang up')), 'upstream')
})

const env = (over: object = {}) => ({
  SITE: 'https://chakkritton.com',
  ALLOWED_ORIGINS: 'https://chakkritton.com',
  LIMITER: { limit: async () => ({ success: true }) },
  AI: { run: async () => { throw new Error('unused') } },
  ...over,
}) as never
const post = (body: unknown, origin = 'https://chakkritton.com') =>
  new Request('https://chakkritton.com/api/assistant', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const ctx = { waitUntil() {}, passThroughOnException() {} } as never

test('a foreign origin is refused', async () => {
  const r = await worker.fetch(post({}, 'https://evil.example'), env(), ctx)
  assert.equal(r.status, 403)
})

test('over the limit answers 429 with rate_limited and a wait', async () => {
  const r = await worker.fetch(post({ messages: [{ role: 'user', content: 'hi' }], lang: 'en' }), env({ LIMITER: { limit: async () => ({ success: false }) } }), ctx)
  assert.equal(r.status, 429)
  assert.deepEqual(await r.json(), { code: 'rate_limited', retryAfter: 60 })
})

test('a bad body answers 400 bad_request', async () => {
  const r = await worker.fetch(post({ nope: true }), env(), ctx)
  assert.equal(r.status, 400)
})
