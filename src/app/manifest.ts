import type { MetadataRoute } from 'next'

import { profile } from '@/config/site'
import { routing } from '@/i18n/routing'
import { siteDescription } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} — ${profile.role}`,
    short_name: profile.name.split(' ')[0],
    description: siteDescription(routing.defaultLocale),
    lang: routing.defaultLocale,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFCF7',
    // Matches `background_color` and the light-mode `themeColor` the layout
    // already declares. This one dresses the installed app's title bar, so a
    // brand colour here would have put a coral band above a cream page — the
    // browser has been blending the two all along, and the installed app should
    // not be the odd one out. There is no media-query form of this field, so it
    // takes the light value; the meta tag still swaps per scheme once the page
    // is up.
    theme_color: '#FFFCF7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
