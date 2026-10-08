import type { CheckId, Env, Result } from './types'

export const CHECKS: { id: CheckId; group: 'portfolio' | 'spentcost' | 'whiteboard' | 'drivemusic'; name: string; hourly?: true }[] = [
  { id: 'portfolio', group: 'portfolio', name: 'Portfolio' },
  { id: 'assistant', group: 'portfolio', name: 'Mr. Worldwide' },
  { id: 'ai', group: 'portfolio', name: 'Mr. Worldwide AI', hourly: true },
  { id: 'expenses', group: 'spentcost', name: 'Spent-Cost' },
  { id: 'reminders', group: 'spentcost', name: 'ระบบแจ้งเตือนบิล' },
  { id: 'whiteboard', group: 'whiteboard', name: 'Whiteboard' },
  { id: 'rooms', group: 'whiteboard', name: 'ห้อง Whiteboard' },
  { id: 'music', group: 'drivemusic', name: 'Drive Music' },
  { id: 'musicsync', group: 'drivemusic', name: 'Party Play sync' },
  { id: 'musicauth', group: 'drivemusic', name: 'ล็อกอิน Google ของ Drive Music' },
]

const TIMEOUT_MS = 10_000

/** One request with a timeout. Any throw, including the timeout, is a failed check. */
export async function httpCheck(id: CheckId, url: string, init: RequestInit, isOk: (res: Response) => Promise<boolean>): Promise<Result> {
  const t0 = Date.now()
  const ok = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
    .then(isOk)
    .catch(() => false)
  return { id, ok, ms: Date.now() - t0 }
}

export const jsonOk = async (r: Response) => r.ok && ((await r.json().catch(() => ({}))) as { ok?: unknown }).ok === true

/** The morning job runs daily; 26 hours leaves two hours of slack before it counts as missed. */
export const fresh = (iso: unknown, now = Date.now()) => {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN
  return Number.isFinite(t) && now - t <= 26 * 3600_000
}

const remindersOk = async (r: Response) => r.ok && fresh(((await r.json().catch(() => ({}))) as { lastRun?: unknown }).lastRun)

/** The rooms worker sends a message as soon as a socket opens; a silent socket means the Durable Object is stuck. */
export async function roomsCheck(rooms: Pick<Fetcher, 'fetch'>, url: string): Promise<Result> {
  const t0 = Date.now()
  let ws: WebSocket | undefined
  let ok = false
  try {
    const res = await rooms.fetch(url, { headers: { Upgrade: 'websocket' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    ws = res.webSocket ?? undefined
    if (res.status === 101 && ws) {
      const sock = ws
      sock.accept()
      ok = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 5000)
        sock.addEventListener('message', () => (clearTimeout(timer), resolve(true)), { once: true })
        sock.addEventListener('close', () => (clearTimeout(timer), resolve(false)), { once: true })
      })
    }
  } catch {
    ok = false
  }
  const ms = Date.now() - t0
  if (ws) await closeCleanly(ws)
  return { id: 'rooms', ok, ms }
}

/**
 * Close and wait (briefly) for the other side's answer. Closing and returning at once dropped the
 * socket when the cron run ended, which Cloudflare counted against the room as a "client
 * disconnected" error every five minutes.
 */
function closeCleanly(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 2000)
    ws.addEventListener('close', () => (clearTimeout(timer), resolve()), { once: true })
    try {
      ws.close(1000, 'health check done')
    } catch {
      clearTimeout(timer)
      resolve()
    }
  })
}

/** Use a service binding so same-account workers.dev routing cannot produce error 1042. */
export async function musicSyncCheck(sync: Pick<Fetcher, 'fetch'>): Promise<Result> {
  const t0 = Date.now()
  let ok = false
  try {
    const response = await sync.fetch('https://drive-music-sync/health', { signal: AbortSignal.timeout(TIMEOUT_MS) })
    const body = await response.json() as { status?: unknown; service?: unknown; protocol?: unknown }
    ok = response.ok && body.status === 'ok' && body.service === 'drive-music-sync' && body.protocol === 2
  } catch {}
  return { id: 'musicsync', ok, ms: Date.now() - t0 }
}

export async function runChecks(env: Env, scheduledTime: number): Promise<Result[]> {
  // The model costs quota, so it is asked once an hour: the run whose scheduled minute is under 5.
  const hourly = new Date(scheduledTime).getUTCMinutes() < 5
  const site = 'https://chakkritton.com'
  return Promise.all([
    httpCheck('portfolio', `${site}/api/health`, {}, jsonOk),
    httpCheck('assistant', `${site}/api/assistant/health`, {}, jsonOk),
    ...(hourly ? [httpCheck('ai', `${site}/api/assistant/health?ai=1`, { headers: { 'x-health-token': env.HEALTH_TOKEN } }, jsonOk)] : []),
    httpCheck('expenses', 'https://expenses.chakkritton.com/api/health', {}, jsonOk),
    httpCheck(
      'reminders',
      env.SUPABASE_FUNCTION_URL,
      { method: 'POST', headers: { 'x-status-secret': env.STATUS_SECRET, 'content-type': 'application/json' }, body: '{"health":true}' },
      remindersOk,
    ),
    httpCheck('whiteboard', 'https://whiteboard.chakkritton.com/', {}, async (r) => r.status === 200),
    // Through the service binding, not the public URL: that one fails in 13ms with Cloudflare's 1042.
    roomsCheck(env.ROOMS, 'https://whiteboard-rooms/__health'),
    musicSyncCheck(env.MUSIC_SYNC),
    httpCheck('music', 'https://drive-music.chakkritton.com/', {}, async (r) => r.status === 200),
    // NextAuth's own endpoint: proves the serverless side and its Google provider are configured.
    httpCheck('musicauth', 'https://drive-music.chakkritton.com/api/auth/providers', {}, async (r) =>
      r.ok && 'google' in ((await r.json().catch(() => ({}))) as object),
    ),
  ])
}
