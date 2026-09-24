// Run: npx tsx --test test/cards.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chooseCards } from '../src/cards'
import type { Item } from '../src/types'

const it = (id: string, locale: 'th' | 'en', group: string): Item => ({
  id, kind: 'project', locale, group, slug: id, url: '', title: '', summary: '', tags: [], stack: [], minutes: 1, cover: null,
})
const items = [it('project:th:smt', 'th', 'smtrack'), it('project:en:smt', 'en', 'smtrack'), it('project:th:spent', 'th', 'project:spent')]

test('one card per piece, in the reader’s language when it exists', () => {
  assert.deepEqual(chooseCards(['project:th:smt', 'project:en:smt'], items, 'en'), ['project:en:smt'])
  assert.deepEqual(chooseCards(['project:en:smt'], items, 'th'), ['project:th:smt'])
})

test('a piece only in another language keeps that card', () => {
  assert.deepEqual(chooseCards(['project:th:spent'], items, 'en'), ['project:th:spent'])
})

test('unknown ids are dropped, order is kept, and there are at most three', () => {
  const many = [...items, it('a', 'en', 'a'), it('b', 'en', 'b')]
  assert.deepEqual(chooseCards(['ghost', 'project:th:spent', 'a', 'b', 'project:en:smt'], many, 'en'), ['project:th:spent', 'a', 'b'])
})

test('an index without groups still gives every known item its own card', () => {
  const old = items.map(({ group: _, ...rest }) => rest) as unknown as Item[]
  assert.deepEqual(chooseCards(['project:th:smt', 'project:en:smt'], old, 'en'), ['project:th:smt', 'project:en:smt'])
})

test('without a CARDS line, items named in the reply become cards, then the ranked ones', () => {
  const named = [{ ...it('project:en:smt', 'en', 'smtrack'), title: 'SMTrack+' }, it('project:en:other', 'en', 'other')]
  assert.deepEqual(chooseCards([], named, 'en', { text: 'Try SMTrack+ — it is great', ranked: [] }), ['project:en:smt'])
  assert.deepEqual(chooseCards([], named, 'en', { text: 'Here is one.', ranked: ['project:en:other'] }), ['project:en:other'])
  assert.deepEqual(chooseCards([], named, 'en', { text: 'Hi there!', ranked: [] }), [])
})
