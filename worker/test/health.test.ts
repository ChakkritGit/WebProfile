// Run: npx tsx --test test/health.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { health } from '../src/health'

const env = { HEALTH_TOKEN: 'secret' } as never
const req = (qs = '', token?: string) =>
  new Request(`https://chakkritton.com/api/assistant/health${qs}`, { headers: token ? { 'x-health-token': token } : {} })
const deps = (over: object = {}) => {
  const calls = { ai: 0 }
  return {
    calls,
    deps: { loadIndex: async () => [], runAi: async () => { calls.ai++ }, ...over } as never,
  }
}

test('index ok answers 200 ok:true and is not cached', async () => {
  const r = await health(req(), env, deps().deps)
  assert.equal(r.status, 200)
  assert.equal(r.headers.get('Cache-Control'), 'no-store')
  const b = (await r.json()) as { ok: boolean; ai?: unknown }
  assert.equal(b.ok, true)
  assert.equal(b.ai, undefined)
})

test('an index failure answers 503', async () => {
  const r = await health(req(), env, deps({ loadIndex: async () => { throw new Error('x') } }).deps)
  assert.equal(r.status, 503)
  assert.equal(((await r.json()) as { ok: boolean }).ok, false)
})

test('ai=1 without a valid token never reaches the model', async () => {
  const d = deps()
  for (const r of [req('?ai=1'), req('?ai=1', 'wrong')]) assert.equal((await health(r, env, d.deps)).status, 200)
  // an unset server token must not match an empty header either
  assert.equal((await health(req('?ai=1'), { HEALTH_TOKEN: '' } as never, d.deps)).status, 200)
  assert.equal(d.calls.ai, 0)
})

test('ai=1 with the right token runs the model; a throw answers 503', async () => {
  const d = deps()
  const ok = await health(req('?ai=1', 'secret'), env, d.deps)
  assert.equal(ok.status, 200)
  assert.equal(d.calls.ai, 1)
  assert.equal(((await ok.json()) as { ai: { ok: boolean } }).ai.ok, true)
  const bad = await health(req('?ai=1', 'secret'), env, deps({ runAi: async () => { throw new Error('quota') } }).deps)
  assert.equal(bad.status, 503)
})
