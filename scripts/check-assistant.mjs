// Run against a production build: npm run build && npx next start -p 3941, then node scripts/check-assistant.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3941'
const fail = []
const ok = (cond, msg) => {
  if (!cond) fail.push(msg)
}
const stub = (page) =>
  page.route('**/api/assistant', (r) =>
    r.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: 'event: text\ndata: {"t":"SMTrack+ is the one!"}\n\nevent: cards\ndata: {"ids":["project:en:smtrack-plus"]}\n\nevent: done\ndata: {}\n\n',
    }),
  )

// Headful, so WebGL runs on the GPU as it does for visitors.
const browser = await chromium.launch({ headless: false, args: ['--window-position=3000,3000'] })
for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await stub(page)
  await page.goto(`${BASE}/en/blog`, { waitUntil: 'networkidle' })
  await page.mouse.move(40, 40) // he loads on the first interaction
  await page.waitForSelector('canvas.mw-stage', { timeout: 15000 })
  await page.waitForTimeout(1500)

  // A point in the strip away from him still reaches the page.
  const hit = await page.evaluate(() => {
    const c = document.querySelector('canvas.mw-stage').getBoundingClientRect()
    return document.elementFromPoint(window.innerWidth / 2, c.top + 20)?.tagName
  })
  ok(hit !== 'CANVAS', `${label}: the strip blocks the page (${hit})`)

  // Open with the keyboard, ask, see a card, close with Esc, focus comes back to him.
  await page.focus('canvas.mw-stage')
  await page.keyboard.press('Enter')
  await page.waitForSelector('dialog.mw-screen[open]')
  await page.fill('.mw-input input', 'Any IoT projects?')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.mw-card', { timeout: 5000 })
  ok((await page.textContent('.mw-log')).includes('SMTrack+'), `${label}: answer text missing`)
  await page.keyboard.press('Escape')
  ok(!(await page.$('dialog.mw-screen[open]')), `${label}: Esc did not close`)
  ok((await page.evaluate(() => document.activeElement?.tagName)) === 'CANVAS', `${label}: focus did not return to him`)
  ok(errors.length === 0, `${label}: page errors ${errors.join(' | ')}`)

  // No layout shift from him.
  const cls = await page.evaluate(
    () =>
      new Promise((res) => {
        let v = 0
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value
        }).observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => res(v), 500)
      }),
  )
  ok(cls < 0.01, `${label}: CLS ${cls}`)
  await page.close()
}

// No WebGL: the fallback button.
const noGl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] })
const p2 = await noGl.newPage()
await p2.goto(`${BASE}/en`, { waitUntil: 'networkidle' })
await p2.mouse.move(40, 40)
await p2.waitForTimeout(4000)
ok(!!(await p2.$('.mw-fallback')), 'no-WebGL fallback missing')
await noGl.close()

// Studio has no Mr. Worldwide.
const p3 = await browser.newPage()
await p3.goto(`${BASE}/en/studio/login`, { waitUntil: 'networkidle' })
await p3.mouse.move(40, 40)
await p3.waitForTimeout(4000)
ok(!(await p3.$('canvas.mw-stage')), 'studio shows the character')
await browser.close()

console.log(fail.length ? `FAIL\n- ${fail.join('\n- ')}` : 'all assistant checks passed')
process.exit(fail.length ? 1 : 0)
