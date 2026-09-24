export type ErrorCode = 'rate_limited' | 'quota' | 'upstream' | 'bad_request' | 'network'
export type ChatMsg = { role: 'user' | 'assistant'; content: string; cards?: string[] }
type Result = { ok: true } | { ok: false; code: ErrorCode; retryAfter?: number }

/** Server-Sent Events, fed chunk by chunk; calls back once per whole event. */
export function createSseParser(on: (event: string, data: unknown) => void) {
  let carry = ''
  return (chunk: string) => {
    carry += chunk
    const parts = carry.split('\n\n')
    carry = parts.pop() ?? ''
    for (const part of parts) {
      const name = /^event: (.*)$/m.exec(part)?.[1]
      const data = /^data: (.*)$/m.exec(part)?.[1]
      if (name && data !== undefined) on(name, JSON.parse(data))
    }
  }
}

/** One question to Mr. Worldwide, streamed; resolves when the answer is complete or fails. */
export async function ask(o: {
  url: string
  messages: ChatMsg[]
  lang: 'th' | 'en'
  signal: AbortSignal
  onText(t: string): void
  onCards(ids: string[]): void
}): Promise<Result> {
  try {
    const res = await fetch(o.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: o.messages.map(({ role, content }) => ({ role, content })), lang: o.lang }),
      signal: o.signal,
    })
    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { code?: ErrorCode; retryAfter?: number }
      return { ok: false, code: body.code ?? 'upstream', ...(body.retryAfter ? { retryAfter: body.retryAfter } : {}) }
    }
    let done = false
    let failed: ErrorCode | null = null
    const push = createSseParser((event, data) => {
      if (event === 'text') o.onText((data as { t: string }).t)
      else if (event === 'cards') o.onCards((data as { ids: string[] }).ids)
      else if (event === 'done') done = true
      else if (event === 'error') failed = (data as { code: ErrorCode }).code
    })
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    for (;;) {
      const { value, done: end } = await reader.read()
      if (end) break
      push(value)
    }
    if (failed) return { ok: false, code: failed }
    return done ? { ok: true } : { ok: false, code: 'network' }
  } catch (err) {
    // A newer question replaced this one: not an error the reader should see.
    if (o.signal.aborted || (err as Error).name === 'AbortError') return { ok: true }
    return { ok: false, code: 'network' }
  }
}
