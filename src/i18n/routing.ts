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
 * Any locale can hold content. Japanese started as a UI-only translation, but the
 * studio has always let an author pick it, and two posts were saved that way —
 * treating `ja` as "reads the English corpus" made those rows unreachable from
 * the studio while still being served at their URLs.
 */
export type ContentLocale = Locale

/**
 * Which language to show a piece of content in, best first.
 *
 * A listing is never filtered down to one language: a post written only in Thai
 * still belongs on `/ja/blog`, or the site would silently have less to show in
 * one interface language than another. The reader picks the language they read
 * the interface in, and each entry appears in the closest language it exists in.
 */
const FALLBACK_ORDER: Record<Locale, readonly ContentLocale[]> = {
  // Own language first, then the closest one a reader is likely to manage.
  // Deriving this from `routing.locales` order instead put Thai ahead of English
  // for Japanese readers, which is the least useful of the three.
  th: ['th', 'en', 'ja'],
  en: ['en', 'th', 'ja'],
  ja: ['ja', 'en', 'th'],
}

export function contentLocalePreference(locale: Locale): readonly ContentLocale[] {
  return FALLBACK_ORDER[locale]
}

export const localeMeta: Record<Locale, { label: string; htmlLang: string; short: string }> = {
  th: { label: 'ไทย', htmlLang: 'th-TH', short: 'TH' },
  en: { label: 'English', htmlLang: 'en-US', short: 'EN' },
  ja: { label: '日本語', htmlLang: 'ja-JP', short: 'JA' },
}
