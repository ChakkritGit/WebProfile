// Run: npx tsx --test test/prompt.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMessages, indexLine, todayLine } from '../src/prompt'
import type { Item, Msg } from '../src/types'

const item: Item = { id: 'project:en:smtrack', kind: 'project', locale: 'en', group: 'smtrack', slug: 'smtrack', url: 'https://chakkritton.com/en/projects/smtrack', title: 'SMTrack+', summary: 'Live fridge temperatures', tags: ['IoT'], stack: ['MQTT'], minutes: 5, cover: null }

test('an index line carries the id, kind, title and tags', () => {
  const line = indexLine(item)
  for (const part of ['[project:en:smtrack]', 'Project', 'SMTrack+', 'IoT', 'MQTT']) assert.ok(line.includes(part), part)
})

test('the system prompt holds the persona, the rules and every index line', () => {
  const [system] = buildMessages({ items: [item], details: [], history: [{ role: 'user', content: 'hi' }], lang: 'en' })
  assert.equal(system.role, 'system')
  assert.ok(system.content.includes('Scrolly'))
  assert.ok(system.content.includes('CARDS:'))
  assert.ok(system.content.includes(indexLine(item)))
})

test('details are quoted, history is kept to the last 8, and thinking is switched off', () => {
  const history: Msg[] = Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
  const out = buildMessages({ items: [item], details: [{ item, text: 'Full text here' }], history, lang: 'th' })
  assert.ok(out[0].content.includes('Full text here'))
  assert.equal(out.length, 1 + 8)
  assert.ok(out.at(-1)!.content.endsWith('/no_think'))
  assert.ok(out[0].content.includes('Thai'))
})

test('todayLine uses the Bangkok date, which is a day ahead of UTC at 00:30', () => {
  assert.ok(todayLine('th', new Date('2026-09-30T17:30:00Z')).includes('1 October 2026'))
  assert.equal(todayLine('en', new Date('2026-10-01T05:00:00Z')), 'Today is Thursday 1 October 2026 (Asia/Bangkok).')
})

test('the chat system prompt carries the date', () => {
  const [system] = buildMessages({ items: [item], details: [], history: [], lang: 'en', now: new Date('2026-10-01T05:00:00Z') })
  assert.ok(system.content.includes('Today is Thursday 1 October 2026'))
})
