import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPublicApi } from './public-api'

const post = { slug: 'hello', title: 'Hello', summary: 'Published article', tags: ['TypeScript'], publishedAt: null }
const project = { slug: 'demo', title: 'Demo', summary: null, tags: [], stack: ['Next.js'], publishedAt: '2026-10-01' }

test('search preserves the public index contract, ordering and cache policy for every locale', async () => {
  for (const locale of ['th', 'en', 'ja'] as const) {
    const calls: string[] = []
    const app = createPublicApi({
      listPosts: async (options) => { calls.push(`posts:${options.locale}`); return [post] },
      listProjects: async (options) => { calls.push(`projects:${options.locale}`); return [project] },
      checkDatabase: null,
    })
    const response = await app.fetch(new Request(`http://localhost/api/search?locale=${locale}`))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [
      { kind: 'post', href: '/blog/hello', title: post.title, summary: post.summary, tags: post.tags, publishedAt: null },
      { kind: 'project', href: '/projects/demo', title: project.title, summary: null, tags: [], stack: project.stack, publishedAt: project.publishedAt },
    ])
    assert.deepEqual(calls, [`posts:${locale}`, `projects:${locale}`])
    assert.equal(response.headers.get('cache-control'), 'public, s-maxage=60, stale-while-revalidate=300')
  }
})

test('search keeps the default locale and first query value semantics', async () => {
  const locales: string[] = []
  const app = createPublicApi({
    listPosts: async ({ locale }) => { locales.push(locale); return [] },
    listProjects: async () => [], checkDatabase: null,
  })
  for (const query of ['', '?locale=invalid', '?locale=en&locale=ja']) {
    const response = await app.fetch(new Request(`http://localhost/api/search${query}`))
    assert.deepEqual(await response.json(), [])
  }
  assert.deepEqual(locales, ['th', 'th', 'en'])
})

test('HEAD remains available without a response body', async () => {
  const app = createPublicApi({ listPosts: async () => [], listProjects: async () => [], checkDatabase: async () => 1 })
  for (const path of ['/api/search', '/api/health', '/api/healthz']) {
    const response = await app.fetch(new Request(`http://localhost${path}`, { method: 'HEAD' }))
    assert.equal(response.status, 200)
    assert.equal(await response.text(), '')
  }
})

test('liveness performs no content reads or database work', async () => {
  const unexpected = async (): Promise<never> => { throw new Error('must not be called') }
  const app = createPublicApi({ listPosts: unexpected, listProjects: unexpected, checkDatabase: unexpected })
  const response = await app.fetch(new Request('http://localhost/api/healthz'))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('health checks the database and reports only booleans and a timing', async () => {
  let calls = 0
  const app = createPublicApi({
    listPosts: async () => [], listProjects: async () => [],
    checkDatabase: async () => { calls++; return [{ value: 1 }] },
  })
  const response = await app.fetch(new Request('http://localhost/api/health'))
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(calls, 1)
  assert.equal(body.ok, true)
  assert.equal(body.db.ok, true)
  assert.equal(typeof body.db.ms, 'number')
  assert.deepEqual(Object.keys(body.db).sort(), ['ms', 'ok'])
  assert.equal(response.headers.get('cache-control'), 'public, s-maxage=15')
})

test('unconfigured and failing databases are unhealthy without exposing errors', async () => {
  for (const checkDatabase of [null, async () => { throw new Error('private database failure') }]) {
    const app = createPublicApi({ listPosts: async () => [], listProjects: async () => [], checkDatabase })
    const response = await app.fetch(new Request('http://localhost/api/health'))
    assert.equal(response.status, 503)
    const text = await response.text()
    assert.equal(JSON.parse(text).ok, false)
    assert.equal(text.includes('private'), false)
  }
})

test('unexpected search failures do not disclose internal error messages', async () => {
  const app = createPublicApi({
    listPosts: async () => { throw new Error('private content failure') },
    listProjects: async () => [], checkDatabase: null,
  })
  const response = await app.fetch(new Request('http://localhost/api/search'))
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Internal server error' })
})
