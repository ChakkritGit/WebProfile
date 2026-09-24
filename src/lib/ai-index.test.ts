// Run: npx tsx --test src/lib/ai-index.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toAiItems } from './ai-index'

const base = {
  translationKey: null, coverImage: null, content: { time: 0, blocks: [], version: '2' }, featured: false,
  publishedAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', views: 0, readingMinutes: 3,
}
const post = (over: object) => ({ ...base, id: 'p', slug: 'hello', locale: 'th', title: 'สวัสดี', summary: 's', tags: ['AI'], status: 'PUBLISHED', ...over })
const project = (over: object) => ({ ...post({}), role: null, stack: ['Next.js'], year: 2026, liveUrl: null, repoUrl: null, sortOrder: 0, ...over })

test('published posts and projects become items with ids and page urls', () => {
  const items = toAiItems([post({})] as never, [project({ slug: 'board', locale: 'en', title: 'Board' })] as never)
  assert.deepEqual(items.map((i) => i.id), ['post:th:hello', 'project:en:board'])
  assert.equal(items[0].url, 'https://chakkritton.com/blog/hello')
  assert.equal(items[1].url, 'https://chakkritton.com/en/projects/board')
  assert.deepEqual(items[1].stack, ['Next.js'])
  assert.equal(items[0].minutes, 3)
})

test('drafts never appear, and the same record twice appears once', () => {
  const items = toAiItems([post({}), post({}), post({ slug: 'wip', status: 'DRAFT' })] as never, [])
  assert.deepEqual(items.map((i) => i.id), ['post:th:hello'])
})

test('only th and en records are indexed', () => {
  assert.equal(toAiItems([post({ locale: 'ja' })] as never, []).length, 0)
})

test('translations share a group; an untranslated record is its own group', () => {
  const items = toAiItems(
    [post({ translationKey: 'mole' }), post({ slug: 'mole-en', locale: 'en', translationKey: 'mole' }), post({ slug: 'solo' })] as never,
    [],
  )
  assert.deepEqual(items.map((i) => i.group), ['mole', 'mole', 'post:solo'])
})
