import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['th', 'en'],
  defaultLocale: 'th',
  // Thai lives at `/`, English at `/en/...` — best of clean URLs + hreflang SEO.
  localePrefix: 'as-needed',
  // Without an explicit maxAge the preference cookie is session-only, so the
  // chosen language was forgotten as soon as the browser closed.
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
})

export type Locale = (typeof routing.locales)[number]

export const localeMeta: Record<Locale, { label: string; htmlLang: string }> = {
  th: { label: 'ไทย', htmlLang: 'th-TH' },
  en: { label: 'English', htmlLang: 'en-US' },
}
