import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['th', 'en', 'ja'],
  defaultLocale: 'th',
  // Thai lives at `/`, the others at `/en/…` and `/ja/…` — best of clean URLs
  // and hreflang SEO.
  localePrefix: 'as-needed',
  // Without an explicit maxAge the preference cookie is session-only, so the
  // chosen language was forgotten as soon as the browser closed.
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
})

export type Locale = (typeof routing.locales)[number]

/**
 * Locales that articles and projects are actually written in.
 *
 * Japanese is a UI translation only: the interface is localised, but the
 * long-form content is not, so `ja` reads the English corpus rather than
 * showing an empty site.
 */
export type ContentLocale = 'th' | 'en'

export function contentLocaleFor(locale: Locale): ContentLocale {
  return locale === 'th' ? 'th' : 'en'
}

export const localeMeta: Record<Locale, { label: string; htmlLang: string; short: string }> = {
  th: { label: 'ไทย', htmlLang: 'th-TH', short: 'TH' },
  en: { label: 'English', htmlLang: 'en-US', short: 'EN' },
  ja: { label: '日本語', htmlLang: 'ja-JP', short: 'JA' },
}
