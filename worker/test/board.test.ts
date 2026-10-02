// Run: npx tsx --test test/board.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBoardBody } from '../src/board'

const item = (over: object = {}) => ({ id: 'a', kind: 'note', text: 'hello', x: 1, y: 2, ...over })
const body = (over: object = {}) => JSON.stringify({ mode: 'plan', lang: 'th', request: ' do it ', board: { items: [item()] }, ...over })

test('parseBoardBody accepts a valid body and trims the request', () => {
  assert.deepEqual(parseBoardBody(body()), { mode: 'plan', lang: 'th', request: 'do it', items: [item()] })
  assert.equal(parseBoardBody(body({ board: { items: [item({ frame: 'f1' })] } }))!.items[0].frame, 'f1')
})

test('parseBoardBody rejects every violation with null', () => {
  assert.equal(parseBoardBody('not json'), null)
  assert.equal(parseBoardBody(body({ mode: 'nope' })), null)
  assert.equal(parseBoardBody(body({ lang: 'ja' })), null)
  assert.equal(parseBoardBody(body({ request: '   ' })), null)
  assert.equal(parseBoardBody(body({ request: 'x'.repeat(501) })), null)
  assert.equal(parseBoardBody(body({ board: { items: Array.from({ length: 121 }, () => item()) } })), null)
  assert.equal(parseBoardBody(body({ board: { items: [item({ text: 'x'.repeat(121) })] } })), null)
  assert.equal(parseBoardBody(body({ board: { items: [item({ x: '1' })] } })), null)
  assert.equal(parseBoardBody(body({ board: { items: [item({ x: null })] } })), null) // JSON turns Infinity/NaN into null
  assert.equal(parseBoardBody(JSON.stringify({ mode: 'plan', lang: 'th', request: 'x' })), null)
})

import { extractJson, clampPlan, filterTidy } from '../src/board'

test('extractJson finds the object in prose and think tags', () => {
  assert.deepEqual(extractJson('<think>{"a":0}</think>Sure! {"a":1} hope that helps {"b":2}'), { a: 1 })
  assert.deepEqual(extractJson('x {"t":"a } b \\" {","n":{"k":1}} y'), { t: 'a } b " {', n: { k: 1 } })
  assert.deepEqual(extractJson('<think>pondering {"a":0}'), null)
  assert.deepEqual(extractJson('<think>hm {</think>{"a":3}'), { a: 3 })
  assert.equal(extractJson('no json here'), null)
  assert.equal(extractJson('{"a": '), null)
})

test('clampPlan clamps a kanban and drops empties', () => {
  const columns = Array.from({ length: 20 }, (_, i) => ({ title: `c${i}`, cards: ['ok', '  ', 'y'.repeat(100), ...Array(10).fill('z')] }))
  const p = clampPlan({ type: 'kanban', title: 't'.repeat(81), columns: [{ title: ' ', cards: ['a'] }, ...columns] })!
  assert.equal(p.type, 'kanban')
  if (p.type !== 'kanban') return
  assert.equal(p.title.length, 80)
  assert.equal(p.columns.length, 6)
  assert.equal(p.columns[0].title, 'c0')
  assert.equal(p.columns[0].cards.length, 8)
  assert.equal(p.columns[0].cards[1].length, 80)
})

test('clampPlan handles a timeline and rejects the unusable', () => {
  const ms = Array.from({ length: 12 }, (_, i) => ({ title: `m${i}`, note: i ? undefined : ' soon ' }))
  const p = clampPlan({ type: 'timeline', title: 'T', milestones: ms })!
  assert.equal(p.type === 'timeline' && p.milestones.length, 10)
  assert.deepEqual(p.type === 'timeline' && p.milestones[0], { title: 'm0', note: 'soon' })
  assert.equal(clampPlan({ type: 'kanban', title: 'x', columns: [] }), null)
  assert.equal(clampPlan({ type: 'timeline', milestones: [] }), null)
  assert.equal(clampPlan({ type: 'pie' }), null)
  assert.equal(clampPlan(null), null)
})

const N = (id: string, shape = 'process') => ({ id, label: `step ${id}`, shape })
const flow = (nodes: unknown, edges: unknown) => clampPlan({ type: 'flowchart', title: 'F', nodes, edges })

test('clampPlan keeps a valid flowchart unchanged', () => {
  const nodes = [N('n1', 'start'), N('n2'), N('n3', 'decision'), N('n4'), N('n5', 'end')]
  const edges = [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4', label: 'Yes' }, { from: 'n3', to: 'n5', label: 'No' }, { from: 'n4', to: 'n5' }]
  assert.deepEqual(flow(nodes, edges), { type: 'flowchart', title: 'F', nodes, edges })
})

test('clampPlan flowchart drops the unusable and keeps the rest', () => {
  const two = [N('a'), N('b')]
  const ab = { from: 'a', to: 'b' }
  const p = (nodes: unknown, edges: unknown) => flow(nodes, edges) as Extract<NonNullable<ReturnType<typeof clampPlan>>, { type: 'flowchart' }>
  assert.deepEqual(p([N('a'), N('a'), N('b')], [ab]).nodes.map((n) => n.id), ['a', 'b']) // duplicate id
  assert.deepEqual(p([...two, { label: 'no id' }, { id: 'c', label: ' ' }], [ab]).nodes.length, 2) // no id, empty label
  assert.deepEqual(p(two, [{ from: 'a', to: 'zzz' }, ab]).edges, [ab]) // unknown end
  assert.deepEqual(p(two, [{ from: 'a', to: 'a' }, ab]).edges, [ab]) // self-edge
  assert.deepEqual(p(two, [ab, { ...ab, label: 'again' }]).edges, [ab]) // repeat
  assert.equal(p(two, [ab, 'a->b']).edges.length, 1) // string edge ignored
  assert.equal(p([N('a', 'blob'), N('b')], [ab]).nodes[0].shape, 'process')
  assert.deepEqual(p(two, [{ ...ab, label: ' ' }]).edges, [ab]) // empty label omitted
  assert.equal(p(two, [{ ...ab, label: 'x'.repeat(40) }]).edges[0].label!.length, 24)
  assert.equal(p([{ id: 'i'.repeat(20), label: 'L'.repeat(100) }, N('b')], [{ from: 'i'.repeat(16), to: 'b' }]).nodes[0].label.length, 80)
  const many = Array.from({ length: 20 }, (_, i) => N(`n${i}`))
  assert.equal(p(many, many.slice(1).map((n, i) => ({ from: `n${i}`, to: n.id }))).nodes.length, 14)
})

test('clampPlan flowchart keeps a cycle and rejects too little', () => {
  const retry = [{ from: 'a', to: 'b' }, { from: 'b', to: 'a', label: 'Retry' }]
  assert.equal((flow([N('a'), N('b')], retry) as { edges: unknown[] }).edges.length, 2)
  assert.equal(flow([N('a')], [{ from: 'a', to: 'a' }]), null)
  assert.equal(flow([N('a'), N('b')], ['a->b']), null)
  assert.equal(flow([N('a'), N('b')], []), null)
})

test('filterTidy drops unknown ids, repeats and small groups', () => {
  const ids = new Set(['a', 'b', 'c', 'd'])
  const g = filterTidy({ groups: [{ title: 'one', ids: ['a', 'b', 'zzz', 'a'] }, { title: 'two', ids: ['b', 'c'] }, { title: 'three', ids: ['c', 'd'] }] }, ids)
  assert.deepEqual(g, [{ title: 'one', ids: ['a', 'b'] }, { title: 'three', ids: ['c', 'd'] }])
  assert.equal(filterTidy({ groups: [{ title: 'x', ids: ['a', 'nope'] }] }, ids), null)
  assert.deepEqual(filterTidy({ groups: [{ title: 'x', ids: 'a, b' }] }, ids), [{ title: 'x', ids: ['a', 'b'] }])
  assert.equal(filterTidy({}, ids), null)
})

import worker from '../src/index'

const ENV = (run: (...a: unknown[]) => Promise<unknown>, over: object = {}) =>
  ({
    SITE: 'https://chakkritton.com',
    ALLOWED_ORIGINS: 'https://chakkritton.com,https://whiteboard.chakkritton.com',
    LIMITER: { limit: async () => ({ success: true }) },
    AI: { run },
    ...over,
  }) as never
const req = (mode: string, over: object = {}, origin = 'https://whiteboard.chakkritton.com') =>
  new Request('https://chakkritton.com/api/assistant/board', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, lang: 'en', request: 'go', board: { items: [item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c' })] }, ...over }),
  })
const CTX = { waitUntil() {}, passThroughOnException() {} } as never
const counting = (...replies: unknown[]) => {
  const calls: unknown[][] = []
  return { calls, run: async (...a: unknown[]) => { calls.push(a); const r = replies[Math.min(calls.length - 1, replies.length - 1)]; if (r instanceof Error) throw r; return r } }
}

test('board: a disallowed origin gets 403', async () => {
  const ai = counting({ response: '' })
  assert.equal((await worker.fetch(req('plan', {}, 'https://evil.example'), ENV(ai.run), CTX)).status, 403)
  assert.equal(ai.calls.length, 0)
})

test('board: a bad body gets 400 and the model is never called', async () => {
  const ai = counting({ response: '' })
  assert.equal((await worker.fetch(req('plan', { request: '' }), ENV(ai.run), CTX)).status, 400)
  assert.equal((await worker.fetch(req('nope'), ENV(ai.run), CTX)).status, 400)
  assert.equal(ai.calls.length, 0)
})

test('board: plan answers a clamped plan from prose plus JSON', async () => {
  const cols = Array.from({ length: 9 }, (_, i) => ({ title: `c${i}`, cards: ['x'] }))
  const ai = counting({ response: `<think>hm</think>Here you go: ${JSON.stringify({ type: 'kanban', title: 'P', columns: cols })} enjoy` })
  const r = await worker.fetch(req('plan'), ENV(ai.run), CTX)
  assert.equal(r.status, 200)
  assert.match(r.headers.get('Content-Type')!, /application\/json/)
  const { plan } = (await r.json()) as { plan: { columns: unknown[] } }
  assert.equal(plan.columns.length, 6)
  assert.equal(ai.calls.length, 1)
})

test('board: plan retries once, then answers 422 unparseable', async () => {
  const ai = counting({ response: 'sorry, no' })
  const r = await worker.fetch(req('plan'), ENV(ai.run), CTX)
  assert.equal(r.status, 422)
  assert.deepEqual(await r.json(), { code: 'unparseable' })
  assert.equal(ai.calls.length, 2)
})

test('board: a retry can succeed', async () => {
  const ai = counting({ response: 'nope' }, { response: '{"type":"timeline","title":"T","milestones":[{"title":"a"}]}' })
  assert.equal((await worker.fetch(req('plan'), ENV(ai.run), CTX)).status, 200)
  assert.equal(ai.calls.length, 2)
})

test('board: tidy keeps only real ids, once each', async () => {
  const ai = counting({ response: JSON.stringify({ groups: [{ title: 'A', ids: ['a', 'b', 'ghost'] }, { title: 'B', ids: ['b', 'c'] }] }) })
  const r = await worker.fetch(req('tidy'), ENV(ai.run), CTX)
  assert.deepEqual(await r.json(), { groups: [{ title: 'A', ids: ['a', 'b'] }] })
})

test('board: summary streams as text/event-stream with no cards event', async () => {
  const enc = new TextEncoder()
  const stream = new ReadableStream({ start(c) { c.enqueue(enc.encode('data: {"response":"A board."}\n\n')); c.enqueue(enc.encode('data: [DONE]\n\n')); c.close() } })
  const ai = counting(stream)
  const r = await worker.fetch(req('summary'), ENV(ai.run), CTX)
  assert.match(r.headers.get('Content-Type')!, /text\/event-stream/)
  const text = await r.text()
  assert.match(text, /event: text/)
  assert.match(text, /event: done/)
  assert.doesNotMatch(text, /event: cards/)
  assert.equal((ai.calls[0][1] as { stream: boolean }).stream, true)
})

test('board: a quota error gives 503, anything else 502', async () => {
  assert.equal((await worker.fetch(req('plan'), ENV(counting(new Error('4006: daily allocation')).run), CTX)).status, 503)
  assert.equal((await worker.fetch(req('tidy'), ENV(counting(new Error('boom')).run), CTX)).status, 502)
})

test('board: rate limit gives 429', async () => {
  const r = await worker.fetch(req('plan'), ENV(counting({}).run, { LIMITER: { limit: async () => ({ success: false }) } }), CTX)
  assert.equal(r.status, 429)
})

test('board: reads the OpenAI-shaped reply real Workers AI gives without stream', async () => {
  const ai = counting({ choices: [{ message: { content: '\n\n{"groups":[{"title":"A","ids":["a","b"]}]}' } }] })
  assert.deepEqual(await (await worker.fetch(req('tidy'), ENV(ai.run), CTX)).json(), { groups: [{ title: 'A', ids: ['a', 'b'] }] })
  const parsed = counting({ response: { type: 'timeline', title: 'T', milestones: [{ title: 'a' }] } })
  assert.equal((await worker.fetch(req('plan'), ENV(parsed.run), CTX)).status, 200)
})

import { boardMessages } from '../src/board-prompt'

test('boardMessages: summary forbids Markdown, tidy asks for full grouping', () => {
  const b = { lang: 'en' as const, request: 'go', items: [] }
  assert.match(boardMessages({ ...b, mode: 'summary' })[0].content, /No Markdown/)
  assert.match(boardMessages({ ...b, mode: 'tidy' })[0].content, /exactly one group/)
  assert.match(boardMessages({ ...b, mode: 'plan' })[0].content, /ignore the sentence limit/)
})

test('boardMessages: the plan prompt offers flowchart and steers to it', () => {
  const c = boardMessages({ lang: 'th', request: 'go', items: [], mode: 'plan' })[0].content
  assert.match(c, /"type":"flowchart"/)
  assert.match(c, /Use flowchart when the request asks for a flow/)
  assert.match(c, /exactly one start node/)
})

test('the board system prompt carries the date', () => {
  const b = { lang: 'en' as const, request: 'go', items: [], mode: 'plan' as const }
  assert.match(boardMessages(b, new Date('2026-10-01T05:00:00Z'))[0].content, /Today is Thursday 1 October 2026/)
  assert.match(boardMessages(b)[0].content, /Today is /)
})

test('clampPlan keeps an answer and drops an empty one', () => {
  assert.deepEqual(clampPlan({ type: 'answer', text: '  hi  ' }), { type: 'answer', text: 'hi' })
  assert.equal((clampPlan({ type: 'answer', text: 'x'.repeat(700) }) as { text: string }).text.length, 600)
  assert.equal(clampPlan({ type: 'answer', text: ' ' }), null)
  assert.equal(clampPlan({ type: 'answer' }), null)
})
