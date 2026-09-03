import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Mali } from 'next/font/google'

import '../globals.css'
import { routing } from '@/i18n/routing'
import { profile, SITE_URL } from '@/config/site'
import { Providers } from '@/components/layout/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { QuickContactDock } from '@/components/layout/quick-contact'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

/**
 * Handwriting for Thai and Latin.
 *
 * Mali was chosen over the rounder Thai options because it ships real weights —
 * a single-weight face leaves headings to synthetic bold, which reads as a smudge
 * rather than a heavier pen.
 *
 * Japanese cannot come through here: `next/font/google` self-hosts by subset and
 * offers no `japanese` subset for any family, because Google serves CJK through
 * dynamic unicode-range subsetting that a build-time download cannot reproduce.
 * The Japanese face is linked from Google instead, and only on the pages that
 * render kana — see below.
 */
const mali = Mali({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hand',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFCF7' },
    { media: '(prefers-color-scheme: dark)', color: '#14121C' },
  ],
  colorScheme: 'light dark',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t('siteName')} — ${t('tagline')}`,
      template: `%s · ${t('siteName')}`,
    },
    description: t('defaultDescription'),
    applicationName: t('siteName'),
    authors: [{ name: profile.name, url: SITE_URL }],
    creator: profile.name,
    keywords: [
      'Chakkrit Laolit',
      'จักรกริช',
      'portfolio',
      'full-stack developer',
      'Next.js',
      'TypeScript',
      'Bangkok',
    ],
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: { th: '/', en: '/en', 'x-default': '/' },
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: `${t('siteName')} — ${t('tagline')}`,
      description: t('defaultDescription'),
      url: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Opts every page under this layout into static rendering.

  const t = await getTranslations({ locale, namespace: 'nav' })

  return (
    <html lang={locale} suppressHydrationWarning className={mali.variable}>
      {locale === 'ja' && (
        // Only on Japanese pages: a CJK face is megabytes of glyphs, and Google
        // serves it in unicode-range slices so a reader downloads just the ranges
        // their page uses. Nothing here loads it for Thai or English.
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* eslint-disable-next-line @next/next/no-page-custom-font -- the rule
              is written for the pages router's `_document`, which this app does
              not have; loading it per locale is the point. */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Zen+Kurenaido&display=swap"
          />
        </head>
      )}
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>
            <a
              href="#main"
              className="sticker-sm bg-brand text-brand-ink font-display sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:font-semibold"
            >
              {t('skipToContent')}
            </a>
            <SiteHeader />
            <main id="main" className="relative">
              {children}
            </main>
            <SiteFooter />
            <QuickContactDock />
            {/* No-ops off Vercel; they only report from a deployed instance. */}
            <Analytics />
            <SpeedInsights />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
