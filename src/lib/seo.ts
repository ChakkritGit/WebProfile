import type { Metadata } from 'next'

import { SITE_URL, profile } from '@/config/site'
import { routing, type Locale } from '@/i18n/routing'
import en from '@/messages/en.json'
import th from '@/messages/th.json'

/**
 * Metadata plumbing shared by every route: canonical URLs, hreflang pairs,
 * OpenGraph and Twitter cards. Pages pass in their own copy; everything else
 * (domain, site name, locale codes, robots directives) is derived here.
 */

const OG_LOCALE: Record<Locale, string> = { th: 'th_TH', en: 'en_US' }
const MESSAGES: Record<Locale, { meta: { siteName: string; tagline: string; defaultDescription: string } }> =
  { th, en }

export function siteName(locale: Locale): string {
  return MESSAGES[locale].meta.siteName
}

export function siteDescription(locale: Locale): string {
  return MESSAGES[locale].meta.defaultDescription
}

/**
 * Applies the `localePrefix: 'as-needed'` rule from `src/i18n/routing.ts`:
 * Thai (the default) lives at `/about`, English at `/en/about`.
 */
export function localePath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : `/${path.replace(/^\/+|\/+$/g, '')}`
  if (locale === routing.defaultLocale) return clean || '/'
  return `/${locale}${clean}`
}

export function absoluteUrl(path: string, locale?: Locale): string {
  const pathname = locale ? localePath(path, locale) : path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${pathname === '/' ? '/' : pathname}`
}

/** hreflang map for one logical page, with Thai doubling as `x-default`. */
export function languageAlternates(path: string): Record<Locale | 'x-default', string> {
  return {
    th: absoluteUrl(path, 'th'),
    en: absoluteUrl(path, 'en'),
    'x-default': absoluteUrl(path, routing.defaultLocale),
  }
}

export interface BuildMetadataOptions {
  title?: string
  description?: string
  path?: string
  locale: Locale
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  tags?: string[]
}

export function buildMetadata({
  title,
  description,
  path = '/',
  locale,
  image,
  type = 'website',
  publishedTime,
  tags,
}: BuildMetadataOptions): Metadata {
  const name = siteName(locale)
  const resolvedTitle = title ?? `${name} — ${profile.role}`
  const resolvedDescription = description ?? siteDescription(locale)
  const url = absoluteUrl(path, locale)
  const otherLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale

  // A page that overrides `openGraph` loses the images the `opengraph-image`
  // file convention would have injected, so point at that route explicitly.
  const ogImage = image ?? absoluteUrl('/opengraph-image', locale)
  const images = [{ url: ogImage, width: 1200, height: 630, alt: resolvedTitle }]

  const openGraphBase = {
    title: resolvedTitle,
    description: resolvedDescription,
    url,
    siteName: name,
    locale: OG_LOCALE[locale],
    alternateLocale: [OG_LOCALE[otherLocale]],
    images,
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph:
      type === 'article'
        ? { ...openGraphBase, type: 'article', publishedTime, tags }
        : { ...openGraphBase, type: 'website' },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}
