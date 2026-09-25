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

test('a CARDS line of ids that do not exist falls back like a missing one', () => {
  const named = [{ ...it('post:th:llms', 'th', 'llms'), title: 'llms.txt คืออะไร?' }]
  assert.deepEqual(chooseCards(['post:th:llms-txt-wrong'], named, 'th', { text: 'บทความนี้ดีมาก', ranked: ['post:th:llms'] }), ['post:th:llms'])
})

test('a reply that talks about topics without full titles gets the items those topics belong to', () => {
  const site = [
    { ...it('post:en:llms', 'en', 'llms'), kind: 'post' as const, title: 'What is llms.txt? A new standard for the AI web', tags: ['llms.txt', 'AI'] },
    { ...it('post:en:mole', 'en', 'mole'), kind: 'post' as const, title: 'Clean macOS caches with Mole', tags: ['macOS', 'Mole'] },
    it('project:en:smt', 'en', 'smtrack'),
  ]
  const text = "Let's start with the basics of llms.txt, then some macOS tips."
  assert.deepEqual(chooseCards([], site, 'en', { text, ranked: [], question: 'ขอดูบทความทั้งหมด' }).sort(), ['post:en:llms', 'post:en:mole'])
})

test('asked for all the articles (or projects), with nothing better, the cards are the latest of them', () => {
  const site = [
    { ...it('post:th:a', 'th', 'a'), kind: 'post' as const },
    { ...it('post:th:b', 'th', 'b'), kind: 'post' as const },
    it('project:th:smt', 'th', 'smtrack'),
  ]
  assert.deepEqual(chooseCards([], site, 'th', { text: 'นี่คือบทความทั้งหมดครับ', ranked: [], question: 'ขอดูบทความทั้งหมด' }), ['post:th:a', 'post:th:b'])
  assert.deepEqual(chooseCards([], site, 'th', { text: 'Here you go!', ranked: [], question: 'show me all your projects' }), ['project:th:smt'])
  assert.deepEqual(chooseCards([], site, 'th', { text: 'Hello!', ranked: [], question: 'hello' }), [])
})
