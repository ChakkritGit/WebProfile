// Run: npx tsx --test test/page.test.ts   (from status/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKS } from '../src/checks'
import { handle, render } from '../src/page'
import { bangkokDay, emptyState } from '../src/state'
import type { State } from '../src/types'

const NOW = Date.UTC(2026, 9, 2, 5, 0, 0)
const svc = (status: 'up' | 'down', ms = 120) => ({ status, fails: 0, since: NOW - 3600_000, ms, checkedAt: NOW })
const allUp = (): State => ({
  ...emptyState(),
  lastRun: NOW,
  services: Object.fromEntries(CHECKS.map((c) => [c.id, svc('up')])),
})

test('an empty state renders and says it has never checked', () => {
  const html = render(emptyState(), NOW)
  assert.match(html, /ยังไม่เคยตรวจ/)
  assert.match(html, /ไม่มีเหตุขัดข้องใน 7 วันที่ผ่านมา/)
})

test('all up says everything is normal, with the Bangkok check time', () => {
  const html = render(allUp(), NOW)
  assert.match(html, /ทุกระบบปกติ/)
  assert.match(html, /ตรวจล่าสุด 12:00/)
})

test('one down names it, and an open incident reads "ยังไม่กลับมา"', () => {
  const s = allUp()
  s.services.rooms = svc('down')
  s.incidents = [{ id: 'rooms', start: NOW - 600_000 }]
  const html = render(s, NOW)
  assert.match(html, /มีบางระบบล่ม/)
  assert.match(html, /มีบางระบบล่ม: ห้อง Whiteboard/)
  assert.match(html, /ยังไม่กลับมา/)
})

test('a 95/100 day is an amber bar with its date and percentage in the title', () => {
  const s = allUp()
  s.days.portfolio = { [bangkokDay(NOW)]: [95, 100] }
  const html = render(s, NOW)
  assert.match(html, new RegExp(`class="bar warn" title="${bangkokDay(NOW)}: 95%"`))
})

test('a name with markup is escaped', () => {
  const html = render(allUp(), NOW, [{ id: 'portfolio', group: 'portfolio', name: '<script>alert(1)</script>' }])
  assert.ok(!html.includes('<script>'))
  assert.match(html, /&#60;script&#62;/)
})

test('routes: json, page, and 404', async () => {
  const get = (p: string) => handle(new Request(`https://status.chakkritton.com${p}`), allUp(), NOW)
  const j = (await get('/api/status').json()) as { services: unknown[]; incidents: unknown[]; lastRun: number }
  assert.equal(j.services.length, 7)
  assert.equal(get('/api/status').headers.get('Cache-Control'), 'public, max-age=60')
  assert.equal(get('/').status, 200)
  assert.equal(get('/nope').status, 404)
})
