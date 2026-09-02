import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { locale as rootLocale } from 'next/root-params'
import { routing } from './routing'

/**
 * The locale comes from the `[locale]` root param rather than `requestLocale`,
 * which next-intl deprecated in favour of `next/root-params`. Reading the root
 * param is also what removed the need for `setRequestLocale` in every page.
 *
 * Root params are unavailable outside the `[locale]` segment — route handlers,
 * for one — so a failed read falls back to the default locale rather than
 * throwing.
 */
async function segmentLocale(): Promise<string | undefined> {
  try {
    return await rootLocale()
  } catch {
    return undefined
  }
}

export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await segmentLocale())
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
