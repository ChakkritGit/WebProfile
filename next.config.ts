import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'webring.wonderful.software' },
    ],
  },
  experimental: {
    optimizePackageImports: ['motion'],
    /**
     * A 404 for URLs that match no route at all.
     *
     * The root layout lives under `[locale]`, so a request that never enters
     * that segment — anything with a dot in it, which the proxy's matcher skips
     * — had no layout to render and answered 500. Measured on production:
     * `/nope.txt` and `/nope.json` both returned "A server error occurred",
     * which is also what `/llms-full.txt` did before it existed.
     *
     * `global-not-found` is the convention for exactly this case: a root layout
     * defined under a top-level dynamic segment.
     *
     * It was not the whole fix. The 500 survived this flag because the crash was
     * in our own code: the `[locale]` page is still evaluated on the way here,
     * with no locale, and `contentLocalePreference` returned `undefined` for it.
     * See the guard in `src/i18n/routing.ts`.
     */
    globalNotFound: true,
  },
}

export default withNextIntl(nextConfig)
