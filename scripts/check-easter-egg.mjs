// Run against a running site (BASE=http://localhost:3100 for dev), then: node scripts/check-easter-egg.mjs
// "ton" typed on the home page swaps the hero picture for the black hole; again puts it back.
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3941'
const fail = []
const ok = (cond, msg) => {
  if (!cond) fail.push(msg)
}
const hole = (page) => page.$('[data-art] canvas')

// Headful, so WebGL runs on the GPU as it does for visitors.
const browser = await chromium.launch({ headless: false, args: ['--window-position=3000,3000'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

ok(!(await hole(page)), 'the black hole is there before anyone typed')
await page.keyboard.type('ton')
await page.waitForTimeout(Number(process.env.WAIT ?? 2500))
ok(!!(await hole(page)), '"ton" did not bring the black hole')
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT })
await page.keyboard.type('ton')
await page.waitForTimeout(500)
ok(!(await hole(page)), '"ton" again did not put the picture back')

// Typing in a text field is typing, not the easter egg.
await page.click('button[aria-label*="earch" i]')
await page.waitForSelector('dialog:modal input')
await page.keyboard.type('ton')
await page.keyboard.press('Escape') // the first clears the search field
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
ok(!(await hole(page)), '"ton" typed into the search opened the black hole')
// "ton" asked of Mr. Worldwide: the chat closes, the model is not asked, it plays.
let asked = 0
await page.route('**/api/assistant', (r) => {
  asked++
  r.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: 'event: done\ndata: {}\n\n' })
})
await page.mouse.move(40, 40)
await page.waitForSelector('canvas.mw-stage', { timeout: 15000 })
await page.focus('canvas.mw-stage')
await page.keyboard.press('Enter')
await page.waitForSelector('dialog.mw-screen[open]')
await page.fill('.mw-input input', 'ton')
await page.keyboard.press('Enter')
await page.waitForTimeout(1500)
ok(!(await page.$('dialog.mw-screen[open]')), '"ton" in the chat did not close it')
ok(asked === 0, '"ton" in the chat was sent to the model')
ok(!!(await hole(page)), '"ton" in the chat did not bring the black hole')
ok(errors.length === 0, `page errors: ${errors.join(' | ')}`)
await browser.close()

console.log(fail.length ? `FAIL\n- ${fail.join('\n- ')}` : 'easter egg checks passed')
process.exit(fail.length ? 1 : 0)
