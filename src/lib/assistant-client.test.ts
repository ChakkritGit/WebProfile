// Run: npx tsx --test src/lib/assistant-client.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ask, createSseParser, plain } from './assistant-client'

test('events split across chunks come out whole, in order', () => {
  const got: [string, unknown][] = []
  const push = createSseParser((e, d) => got.push([e, d]))
  push('event: text\ndata: {"t":"Hel')
  push('lo"}\n\nevent: cards\ndata: {"ids":["a"]}\n\nevent: do')
  push('ne\ndata: {}\n\n')
  assert.deepEqual(got, [['text', { t: 'Hello' }], ['cards', { ids: ['a'] }], ['done', {}]])
})

const stream = (s: string) =>
  new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(s)); c.close() } }), { headers: { 'Content-Type': 'text/event-stream' } })
const noop = () => {}

test('ask streams text and cards and reports ok', async () => {
  globalThis.fetch = async () => stream('event: text\ndata: {"t":"Hi"}\n\nevent: cards\ndata: {"ids":["x"]}\n\nevent: done\ndata: {}\n\n')
  let text = ''
  let cards: string[] = []
  const r = await ask({ url: '/api/assistant', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText: (t) => (text += t), onCards: (c) => (cards = c) })
  assert.deepEqual(r, { ok: true })
  assert.equal(text, 'Hi')
  assert.deepEqual(cards, ['x'])
})

test('an error status becomes its code', async () => {
  globalThis.fetch = async () => Response.json({ code: 'rate_limited', retryAfter: 60 }, { status: 429 })
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText: noop, onCards: noop })
  assert.deepEqual(r, { ok: false, code: 'rate_limited', retryAfter: 60 })
})

test('an aborted request reports nothing and stops', async () => {
  const c = new AbortController()
  globalThis.fetch = async () => { c.abort(); throw Object.assign(new Error('aborted'), { name: 'AbortError' }) }
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: c.signal, onText: noop, onCards: noop })
  assert.deepEqual(r, { ok: true })
})

test('a stream that ends without done is a network error', async () => {
  globalThis.fetch = async () => stream('event: text\ndata: {"t":"Hi"}\n\n')
  const r = await ask({ url: '/x', messages: [{ role: 'user', content: 'hi' }], lang: 'en', signal: new AbortController().signal, onText: noop, onCards: noop })
  assert.deepEqual(r, { ok: false, code: 'network' })
})

test('markdown the model slips in is shown as plain text', () => {
  assert.equal(plain('Try **SMTrack+** and __Mole__.\n## Also\n* one\n`code`'), 'Try SMTrack+ and Mole.\nAlso\n• one\ncode')
})
