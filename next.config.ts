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
     * It has never actually rendered, though. `[locale]` matches any single
     * segment and `[locale]/[...rest]` matches everything deeper, so every URL
     * reaches a route and the site's own `[locale]/not-found.tsx` is what a
     * visitor sees. Two other things had to be true for that: the layout treats
     * an unknown locale as the default one instead of calling `notFound()` — from
     * a layout there is no boundary above it, which is what made Next serve its
     * own bare 404 — and the proxy only skips paths whose *last* segment names a
     * file. This stays as the backstop for a route shape that manages to miss
     * both.
     */
    globalNotFound: true,
  },
}

export default withNextIntl(nextConfig)
