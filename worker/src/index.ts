import { buildMessages } from './prompt'
import { rank } from './rank'
import { toClientStream } from './stream'
import type { Env, Item, Lang, Msg } from './types'

const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'
const CACHE = { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit

export function parseBody(raw: string): { messages: Msg[]; lang: Lang } | null {
  let b: unknown
  try {
    b = JSON.parse(raw)
  } catch {
    return null
  }
  const o = b as { messages?: unknown; lang?: unknown }
  if (o?.lang !== 'th' && o?.lang !== 'en') return null
  if (!Array.isArray(o.messages) || o.messages.length === 0) return null
  const messages: Msg[] = []
  for (const m of o.messages.slice(-8)) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim() || content.length > 1000) return null
    messages.push({ role, content })
  }
  if (messages.at(-1)!.role !== 'user') return null
  return { messages, lang: o.lang }
}

export function errorCode(err: unknown): 'quota' | 'upstream' {
  const text = String((err as Error)?.message ?? err)
  return /allocation|neuron|quota|4006/i.test(text) ? 'quota' : 'upstream'
}

function cors(origin: string | null, env: Env): Record<string, string> {
  if (!origin || !env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).includes(origin)) return {}
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', Vary: 'Origin' }
}
const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

async function loadIndex(env: Env): Promise<Item[]> {
  const r = await fetch(`${env.SITE}/ai/index.json`, CACHE)
  if (!r.ok) throw new Error(`index ${r.status}`)
  return ((await r.json()) as { items: Item[] }).items
}
async function loadText(env: Env, it: Item): Promise<string> {
  const r = await fetch(`${env.SITE}/ai/item/${it.kind}/${it.locale}/${encodeURIComponent(it.slug)}.txt`, CACHE)
  return r.ok ? r.text() : ''
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname !== '/api/assistant') return fetch(req)
    const origin = req.headers.get('Origin')
    const h = cors(origin, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: Object.keys(h).length ? 204 : 403, headers: h })
    if (req.method !== 'POST') return json({ code: 'bad_request' }, 405, h)
    if (!Object.keys(h).length) return json({ code: 'bad_request' }, 403, h)

    const ip = req.headers.get('CF-Connecting-IP') ?? 'anonymous'
    if (!(await env.LIMITER.limit({ key: ip })).success) return json({ code: 'rate_limited', retryAfter: 60 }, 429, h)

    const body = parseBody(await req.text())
    if (!body) return json({ code: 'bad_request' }, 400, h)

    try {
      const items = await loadIndex(env)
      const question = body.messages.at(-1)!.content
      const picked = rank(items, question, body.lang).slice(0, 2)
      const details = await Promise.all(picked.map(async (item) => ({ item, text: await loadText(env, item) })))
      const messages = buildMessages({ items, details: details.filter((d) => d.text), history: body.messages, lang: body.lang })
      const upstream = (await env.AI.run(MODEL as never, { messages, stream: true, max_tokens: 400 } as never)) as ReadableStream<Uint8Array>
      return new Response(toClientStream(upstream, new Set(items.map((i) => i.id))), {
        headers: { ...h, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    } catch (err) {
      const code = errorCode(err)
      return json({ code }, code === 'quota' ? 503 : 502, h)
    }
  },
}
