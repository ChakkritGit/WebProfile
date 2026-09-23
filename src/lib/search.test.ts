// Run: npx tsx --test src/lib/search.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDateFilter, parseDateFilter, publishedDates } from './search'

const items = [
  { id: 'a', publishedAt: '2026-09-08T03:00:00Z' },
  { id: 'b', publishedAt: '2025-12-31T20:00:00Z' }, // 1 Jan 2026 in Bangkok
  { id: 'c', publishedAt: '2025-03-15T03:00:00Z' },
  { id: 'd', publishedAt: null },
]
const ids = (list: { id: string }[]) => list.map((i) => i.id)

test('parse ignores what is not a date filter', () => {
  assert.deepEqual(parseDateFilter({ year: '2026', month: '13', sort: 'x' }), { year: 2026, month: undefined, sort: 'new' })
  assert.deepEqual(parseDateFilter({ month: '3', sort: 'old' }), { year: undefined, month: 3, sort: 'old' })
})

test('year, month and both narrow in Bangkok time', () => {
  assert.deepEqual(ids(applyDateFilter(items, { year: 2026, sort: 'new' })), ['a', 'b'])
  assert.deepEqual(ids(applyDateFilter(items, { month: 3, sort: 'new' })), ['c'])
  assert.deepEqual(ids(applyDateFilter(items, { year: 2026, month: 1, sort: 'new' })), ['b'])
})

test('no filter keeps everything, undated last when newest first', () => {
  assert.deepEqual(ids(applyDateFilter([...items], { sort: 'new' })), ['a', 'b', 'c', 'd'])
  assert.deepEqual(ids(applyDateFilter([...items], { sort: 'old' })), ['d', 'c', 'b', 'a'])
})

test('choices are only the year-months that have something', () => {
  const pairs = publishedDates(items).map(([y, m]) => `${y}-${m}`).sort()
  assert.deepEqual(pairs, ['2025-3', '2026-1', '2026-9'])
})
