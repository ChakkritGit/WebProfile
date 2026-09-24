import { createReplyFilter } from './filter'

const enc = new TextEncoder()
const event = (name: string, data: unknown) => enc.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)

/**
 * Workers AI streams `data: {"response": "…"}` events. This reads them (whole
 * events only — a network chunk can end mid-event), runs the text through the
 * reply filter, and emits the page's own events: text, cards, done.
 */
export function toClientStream(
  upstream: ReadableStream<Uint8Array>,
  choose: (ids: string[], text: string) => string[],
): ReadableStream<Uint8Array> {
  const filter = createReplyFilter()
  let full = ''
  const dec = new TextDecoder()
  let carry = ''
  return new ReadableStream<Uint8Array>({
    async start(c) {
      const reader = upstream.getReader()
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          carry += dec.decode(value, { stream: true })
          const parts = carry.split('\n\n')
          carry = parts.pop() ?? ''
          for (const part of parts) {
            const data = part
              .split('\n')
              .find((l) => l.startsWith('data: '))
              ?.slice(6)
            if (!data || data === '[DONE]') continue
            const delta = (JSON.parse(data) as { response?: string }).response ?? ''
            const shown = filter.push(delta)
            full += shown
            if (shown) c.enqueue(event('text', { t: shown }))
          }
        }
        const { text, ids } = filter.end()
        if (text) c.enqueue(event('text', { t: text }))
        full += text
        const known = choose(ids, full)
        if (known.length) c.enqueue(event('cards', { ids: known }))
        c.enqueue(event('done', {}))
      } catch {
        c.enqueue(event('error', { code: 'upstream' }))
      } finally {
        c.close()
      }
    },
  })
}
