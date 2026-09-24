// Run: npx tsx --test test/rank.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rank } from '../src/rank'
import type { Item } from '../src/types'

const it = (id: string, over: Partial<Item>): Item => ({
  id, kind: 'project', locale: 'en', group: id, slug: id, url: '', title: '', summary: '', tags: [], stack: [], minutes: 1, cover: null, ...over,
})
const items = [
  it('project:en:smtrack', { title: 'SMTrack+', tags: ['IoT', 'MQTT'], summary: 'Live fridge temperatures' }),
  it('project:th:board', { locale: 'th', title: 'สร้าง Whiteboard ด้วย Claude Code', summary: 'ไวท์บอร์ดออนไลน์ที่ไม่ต้องสมัคร' }),
  it('post:en:llms', { kind: 'post', title: 'What is llms.txt?', tags: ['AI', 'SEO'] }),
]

test('an English keyword finds the item tagged with it', () => {
  assert.equal(rank(items, 'anything on IoT?', 'en')[0].id, 'project:en:smtrack')
})

test('a Thai question without spaces still finds the Thai item', () => {
  assert.equal(rank(items, 'อยากดูโปรเจคไวท์บอร์ดหน่อย', 'th')[0].id, 'project:th:board')
})

test('dots and cases in a term do not stop a match', () => {
  assert.equal(rank(items, 'LLMS.TXT', 'en')[0].id, 'post:en:llms')
})

test('an unrelated question finds nothing', () => {
  assert.deepEqual(rank(items, 'what is the weather', 'en'), [])
})

test('the reader’s language wins a tie', () => {
  const pair = [it('a', { locale: 'th', title: 'Docker' }), it('b', { locale: 'en', title: 'Docker' })]
  assert.equal(rank(pair, 'docker', 'en')[0].id, 'b')
})
