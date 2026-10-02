import { CHECKS } from './checks'
import { bangkokDay } from './state'
import type { CheckId, Service, State } from './types'

const DAY = 24 * 60 * 60_000
type Check = (typeof CHECKS)[number]

const GROUPS = [
  { id: 'portfolio', name: 'Portfolio' },
  { id: 'spentcost', name: 'Spent-Cost' },
  { id: 'whiteboard', name: 'Whiteboard' },
] as const
const LABEL = { up: 'ปกติ', slow: 'ช้า', down: 'ล่ม', unknown: 'ยังไม่มีข้อมูล' } as const

const esc = (v: unknown) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const hhmm = (ms: number) => new Date(ms + 7 * 60 * 60_000).toISOString().slice(11, 16)
const dayMonth = (ms: number) => bangkokDay(ms).slice(8) + '/' + bangkokDay(ms).slice(5, 7) + ' ' + hhmm(ms)

/** 90-day uptime as a percentage with one decimal, or null with no data. */
function uptime90(state: State, id: CheckId): number | null {
  let ok = 0
  let total = 0
  for (const [a, b] of Object.values(state.days[id] ?? {})) (ok += a), (total += b)
  return total ? Math.round((ok / total) * 1000) / 10 : null
}

const statusOf = (state: State, id: CheckId): Service['status'] => state.services[id]?.status ?? 'unknown'

/** What the JSON endpoint serves. Every check shows, "unknown" until it first runs. */
export function summary(state: State, now: number, checks: Check[] = CHECKS) {
  return {
    services: checks.map((c) => {
      const s = state.services[c.id]
      return { id: c.id, name: c.name, group: c.group, status: statusOf(state, c.id), ms: s?.ms ?? 0, since: s?.since ?? 0, uptime90: uptime90(state, c.id) }
    }),
    incidents: recent(state, now).map((i) => ({ name: nameOf(checks, i.id), start: i.start, end: i.end ?? null })),
    lastRun: state.lastRun,
  }
}

const nameOf = (checks: Check[], id: CheckId) => checks.find((c) => c.id === id)?.name ?? id
const recent = (state: State, now: number) =>
  state.incidents.filter((i) => i.end === undefined || now - i.end <= 7 * DAY).sort((a, b) => b.start - a.start)

function strip(state: State, id: CheckId, now: number): string {
  const days = state.days[id] ?? {}
  let out = ''
  for (let i = 89; i >= 0; i--) {
    const day = bangkokDay(now - i * DAY)
    const c = days[day]
    const ratio = c && c[1] ? c[0] / c[1] : null
    const cls = ratio === null ? 'none' : ratio === 1 ? 'ok' : ratio >= 0.9 ? 'warn' : 'bad'
    const pct = ratio === null ? 'ไม่มีข้อมูล' : `${Math.round(ratio * 1000) / 10}%`
    out += `<i class="bar ${cls}" title="${esc(day)}: ${esc(pct)}"></i>`
  }
  return out
}

export function render(state: State, now: number, checks: Check[] = CHECKS): string {
  const down = checks.filter((c) => statusOf(state, c.id) === 'down')
  const head = down.length ? `มีบางระบบล่ม: ${down.map((c) => c.name).join(', ')}` : 'ทุกระบบปกติ'
  const checked = state.lastRun ? `ตรวจล่าสุด ${hhmm(state.lastRun)}` : 'ยังไม่เคยตรวจ'

  const groups = GROUPS.map((g) => {
    const rows = checks
      .filter((c) => c.group === g.id)
      .map((c) => {
        const st = statusOf(state, c.id)
        const up = uptime90(state, c.id)
        const ms = state.services[c.id]?.ms
        return `<li class="row"><div class="top"><span class="dot ${st}" aria-hidden="true"></span><b>${esc(c.name)}</b><span class="st">${esc(LABEL[st])}</span><span class="ms">${ms ? esc(ms) + ' ms' : ''}</span><span class="pct">${up === null ? '-' : esc(up.toFixed(1)) + '%'}</span></div><div class="strip">${strip(state, c.id, now)}</div></li>`
      })
      .join('')
    return `<section><h2>${esc(g.name)}</h2><ul>${rows}</ul></section>`
  }).join('')

  const inc = recent(state, now)
  const incidents = inc.length
    ? `<ul class="inc">${inc.map((i) => `<li><b>${esc(nameOf(checks, i.id))}</b> ${esc(dayMonth(i.start))} - ${i.end === undefined ? 'ยังไม่กลับมา' : esc(dayMonth(i.end))}</li>`).join('')}</ul>`
    : '<p class="muted">ไม่มีเหตุขัดข้องใน 7 วันที่ผ่านมา</p>'

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>สถานะระบบ · chakkritton.com</title>
<style>
:root{--bg:#fafaf7;--fg:#1a1a17;--muted:#6b6b63;--line:#e3e3dc;--ok:#1a9d55;--warn:#d98a00;--bad:#d6322e;--none:#d4d4cc}
@media (prefers-color-scheme:dark){:root{--bg:#121211;--fg:#ecece6;--muted:#9a9a90;--line:#2a2a27;--ok:#3ccf7a;--warn:#f0aa2a;--bad:#ff6b66;--none:#3a3a36}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,'Segoe UI','Noto Sans Thai',sans-serif}
main{max-width:720px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:1.5rem;margin:0 0 4px}
h2{font-size:1rem;margin:28px 0 8px}
.muted{color:var(--muted);margin:0}
ul{list-style:none;margin:0;padding:0}
.row{padding:12px 0;border-top:1px solid var(--line)}
.top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.top b{flex:1;min-width:8rem}
.dot{width:10px;height:10px;border-radius:50%;background:var(--none);flex:none}
.dot.up{background:var(--ok)}.dot.slow{background:var(--warn)}.dot.down{background:var(--bad)}
.st,.ms,.pct{font-size:.875rem}
.ms,.pct{color:var(--muted);font-variant-numeric:tabular-nums}
.strip{display:flex;gap:1px;margin-top:8px;height:24px}
.bar{flex:1;min-width:0;border-radius:1px;background:var(--none)}
.bar.ok{background:var(--ok)}.bar.warn{background:var(--warn)}.bar.bad{background:var(--bad)}
.inc li{padding:8px 0;border-top:1px solid var(--line)}
</style>
</head>
<body>
<main>
<h1>${esc(head)}</h1>
<p class="muted">${esc(checked)}</p>
${groups}
<section><h2>เหตุขัดข้องใน 7 วันที่ผ่านมา</h2>${incidents}</section>
</main>
</body>
</html>`
}

export function handle(req: Request, state: State, now: number): Response {
  const path = new URL(req.url).pathname
  if (path === '/api/status') {
    return new Response(JSON.stringify(summary(state, now)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } })
  }
  if (path === '/') return new Response(render(state, now), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } })
  return new Response('not found', { status: 404 })
}
