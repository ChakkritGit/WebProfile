// Run: npx tsx --test test/filter.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReplyFilter } from '../src/filter'

const run = (chunks: string[]) => {
  const f = createReplyFilter()
  const shown = chunks.map((c) => f.push(c)).join('')
  const { text, ids } = f.end()
  return { shown: shown + text, ids }
}

test('plain text passes through untouched', () => {
  assert.deepEqual(run(['Hello ', 'there!']), { shown: 'Hello there!', ids: [] })
})

test('a CARDS line split across chunks is removed and parsed', () => {
  const r = run(['Try this one.\nCAR', 'DS: project:en:a, post:th:b'])
  assert.equal(r.shown.trim(), 'Try this one.')
  assert.deepEqual(r.ids, ['project:en:a', 'post:th:b'])
})

test('the word "cards" inside a sentence is text, not a command', () => {
  assert.equal(run(['These cards: ', 'are nice']).shown, 'These cards: are nice')
})

test('a think block, even split, never reaches the reader', () => {
  assert.equal(run(['<thi', 'nk>plan</th', 'ink>Hi']).shown, 'Hi')
})
