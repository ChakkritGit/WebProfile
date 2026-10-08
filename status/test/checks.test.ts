// Run: npx tsx --test test/checks.test.ts   (from status/)
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, httpCheck, jsonOk, runChecks, musicSyncCheck, roomsCheck } from '../src/checks'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})
const stub = (fn: (url: string) => Response | Promise<Response>) => {
  globalThis.fetch = (async (url: string) => fn(String(url))) as never
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

test('httpCheck: ok, a non-200, a throw, and ok:false in the body', async () => {
  stub(() => json({ ok: true }))
  assert.equal((await httpCheck('portfolio', 'https://x', {}, jsonOk)).ok, true)
  stub(() => json({ ok: true }, 503))
  assert.equal((await httpCheck('portfolio', 'https://x', {}, jsonOk)).ok, false)
  stub(() => {
    throw new Error('network')
  })
  const r = await httpCheck('portfolio', 'https://x', {}, jsonOk)
  assert.deepEqual([r.id, r.ok], ['portfolio', false])
  stub(() => json({ ok: false }))
  assert.equal((await httpCheck('portfolio', 'https://x', {}, jsonOk)).ok, false)
})

test('fresh: within 26 hours only', () => {
  const now = Date.parse('2026-10-02T12:00:00Z')
  assert.equal(fresh(new Date(now - 25 * 3600_000).toISOString(), now), true)
  assert.equal(fresh(new Date(now - 27 * 3600_000).toISOString(), now), false)
  assert.equal(fresh(null, now), false)
  assert.equal(fresh('garbage', now), false)
})

test('runChecks asks the model only in minutes 0-4', async () => {
  stub(() => json({ ok: true }))
  const env = { HEALTH_TOKEN: 't', STATUS_SECRET: 's', SUPABASE_FUNCTION_URL: 'https://fn' } as never
  const ids = async (min: number) => (await runChecks(env, Date.UTC(2026, 9, 2, 10, min))).map((r) => r.id)
  for (const m of [0, 4]) assert.ok((await ids(m)).includes('ai'), `minute ${m}`)
  for (const m of [5, 59]) assert.ok(!(await ids(m)).includes('ai'), `minute ${m}`)
  assert.equal((await ids(5)).length, 9)
})


test('Party Play health requires the sync service and current protocol', async () => {
  for (const [body, status, ok] of [
    [{ status: 'ok', service: 'drive-music-sync', protocol: 2 }, 200, true],
    [{ status: 'ok', service: 'drive-music-sync', protocol: 1 }, 200, false],
    [{ status: 'degraded', service: 'drive-music-sync', protocol: 2 }, 503, false],
    [{}, 200, false],
  ] as const) {
    const result = await musicSyncCheck({ fetch: async () => json(body, status) } as never)
    assert.equal(result.id, 'musicsync')
    assert.equal(result.ok, ok)
  }
  assert.equal((await musicSyncCheck({ fetch: async () => { throw new Error('offline') } } as never)).ok, false)
})

test('roomsCheck closes the socket and waits for the answer, outside the timing', async () => {
  // A socket that greets on accept and answers a close 50ms later, like the room does.
  const ws = new EventTarget() as EventTarget & { accept(): void; close(): void; closed: boolean }
  ws.closed = false
  ws.accept = () => setTimeout(() => ws.dispatchEvent(new Event('message')), 0)
  ws.close = () => setTimeout(() => ((ws.closed = true), ws.dispatchEvent(new Event('close'))), 50)
  const rooms = { fetch: async () => ({ status: 101, webSocket: ws }) } as never
  const r = await roomsCheck(rooms, 'https://x/__health')
  assert.equal(r.ok, true)
  assert.equal(ws.closed, true, 'returned before the close was answered')
  assert.ok(r.ms < 50, `timing included the close: ${r.ms}ms`)
})
