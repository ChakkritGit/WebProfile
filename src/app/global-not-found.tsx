import type { Metadata } from 'next'
import { Mali } from 'next/font/google'
import './globals.css'

/**
 * The 404 for anything that matches no route at all.
 *
 * It renders its own document because it has to: this file bypasses the app's
 * layouts entirely, which is the point of it — the root layout is under
 * `[locale]`, and a URL that never reaches that segment has no layout to render
 * inside. That is why `/nope.txt` answered 500 rather than 404.
 *
 * Deliberately small. There is no locale to read here, no messages and no
 * theme provider, so it says the two words in both languages rather than
 * pretending to know which one to use, and links back to a page that does.
 */

const mali = Mali({ subsets: ['latin', 'thai'], weight: ['400', '600'], variable: '--font-hand' })

export const metadata: Metadata = {
  title: '404 — ไม่พบหน้านี้ / Page not found',
  robots: { index: false, follow: false },
}

export default function GlobalNotFound() {
  return (
    <html lang="th" className={mali.variable}>
      <body className="bg-paper text-ink grid min-h-dvh place-items-center p-6">
        <main className="text-center">
          <p className="font-display text-brand-strong text-6xl font-extrabold">404</p>
          <h1 className="font-display mt-3 text-2xl font-bold">ไม่พบหน้าที่คุณเปิด</h1>
          <p className="text-muted mt-1 text-sm">This page does not exist.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              a plain anchor is the correct one here: this file bypasses the
              app's layouts, so there is no router context for `Link` to use,
              and a full navigation is what leaving a 404 should do anyway. */}
          <a
            href="/"
            className="sticker-sm bg-surface font-display mt-6 inline-block px-5 py-2.5 text-sm font-bold no-underline"
          >
            กลับหน้าแรก · Home
          </a>
        </main>
      </body>
    </html>
  )
}
