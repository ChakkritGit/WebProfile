// Run: npx tsx --test test/stream.test.ts   (from worker/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toClientStream } from '../src/stream'

const enc = new TextEncoder()
const upstream = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch))
      c.close()
    },
  })
const sse = (t: string) => `data: ${JSON.stringify({ response: t })}\n\n`
async function read(s: ReadableStream<Uint8Array>) {
  const text = await new Response(s).text()
  return text.split('\n\n').filter(Boolean).map((e) => {
    const ev = /event: (\w+)/.exec(e)![1]
    return [ev, JSON.parse(/data: (.*)/.exec(e)![1])] as const
  })
}

test('text streams out, the CARDS line becomes a cards event with only known ids', async () => {
  const out = await read(toClientStream(upstream([sse('Try SMT'), sse('rack+!\nCARDS: project:en:a, project:en:ghost'), 'data: [DONE]\n\n']), (ids) => ids.filter((id) => id === 'project:en:a')))
  const text = out.filter(([e]) => e === 'text').map(([, d]) => d.t).join('')
  assert.equal(text.trim(), 'Try SMTrack+!')
  assert.deepEqual(out.find(([e]) => e === 'cards')![1], { ids: ['project:en:a'] })
  assert.equal(out.at(-1)![0], 'done')
})

test('an SSE event split across network chunks is still read whole', async () => {
  const whole = sse('Hello')
  const out = await read(toClientStream(upstream([whole.slice(0, 9), whole.slice(9), 'data: [DONE]\n\n']), () => []))
  assert.equal(out.filter(([e]) => e === 'text').map(([, d]) => d.t).join(''), 'Hello')
})

test('the chooser sees the whole reply, so it can find cards the model forgot to list', async () => {
  let seen = ''
  await read(toClientStream(upstream([sse('SMTrack+ is the '), sse('one!'), 'data: [DONE]\n\n']), (ids, text) => ((seen = text), ids)))
  assert.equal(seen, 'SMTrack+ is the one!')
})
