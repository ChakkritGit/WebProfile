import type { Env, Item } from './types'

export const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'

export interface HealthDeps {
  loadIndex: (env: Env) => Promise<Item[]>
  runAi: (env: Env) => Promise<unknown>
}

/** Constant-time, so the token cannot be guessed a byte at a time from response timing. */
function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0 && b.length > 0
}

async function timed(run: () => Promise<boolean>) {
  const t0 = Date.now()
  const ok = await run().catch(() => false)
  return { ok, ms: Date.now() - t0 }
}

// Booleans and timings only: it is public and takes no rate limit. The model runs only
// with the token, because every call costs quota.
export async function health(req: Request, env: Env, deps: HealthDeps): Promise<Response> {
  const wantAi =
    new URL(req.url).searchParams.get('ai') === '1' &&
    Boolean(env.HEALTH_TOKEN) &&
    sameSecret(req.headers.get('x-health-token') ?? '', env.HEALTH_TOKEN!)
  const index = await timed(async () => Array.isArray(await deps.loadIndex(env)))
  const ai = wantAi ? await timed(async () => (await deps.runAi(env), true)) : undefined
  const ok = index.ok && (ai?.ok ?? true)
  return new Response(JSON.stringify({ ok, index, ...(ai && { ai }) }), {
    status: ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
