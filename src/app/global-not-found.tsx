import type { Metadata } from 'next'
import { Noto_Sans, Noto_Sans_Thai } from 'next/font/google'
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

const latin = Noto_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sans-latin' })
const thai = Noto_Sans_Thai({ subsets: ['thai'], axes: ['wdth'], variable: '--font-sans-thai' })

export const metadata: Metadata = {
  title: '404 — ไม่พบหน้านี้ / Page not found',
  robots: { index: false, follow: false },
}

export default function GlobalNotFound() {
  return (
    <html lang="th" className={`${latin.variable} ${thai.variable}`}>
      <body className="bg-paper text-ink grid min-h-dvh place-items-center p-6">
        <main className="text-center">
          <p className="text-brand-strong font-mono text-6xl">404</p>
          <h1 className="font-display mt-3 text-2xl font-bold">ไม่พบหน้าที่คุณเปิด</h1>
          <p className="text-muted mt-1 text-sm">This page does not exist.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              a plain anchor is the correct one here: this file bypasses the
              app's layouts, so there is no router context for `Link` to use,
              and a full navigation is what leaving a 404 should do anyway. */}
          <a
            href="/"
            className="bg-brand text-brand-ink mt-6 inline-block px-5 py-2.5 text-sm font-medium uppercase no-underline"
          >
            กลับหน้าแรก · Home
          </a>
        </main>
      </body>
    </html>
  )
}
