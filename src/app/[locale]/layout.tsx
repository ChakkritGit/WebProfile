import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { IBM_Plex_Sans_Thai, Kanit } from 'next/font/google'

import '../globals.css'
import { routing, type Locale } from '@/i18n/routing'
import { profile, SITE_URL } from '@/config/site'
import { Providers } from '@/components/layout/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { QuickContactDock } from '@/components/layout/quick-contact'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-kanit',
  display: 'swap',
})

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex-thai',
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
  setRequestLocale(locale as Locale)

  const t = await getTranslations({ locale, namespace: 'nav' })

  return (
    <html lang={locale} suppressHydrationWarning className={`${kanit.variable} ${plexThai.variable}`}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>
            <a
              href="#main"
              className="sticker-sm bg-brand text-brand-ink font-display sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:font-semibold"
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
