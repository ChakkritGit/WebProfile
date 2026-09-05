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
    background_color: '#ffffff',
    // Matches `background_color` and the light-mode `themeColor` the layout
    // already declares. The cream this used to be belonged to a palette this
    // branch no longer uses; the paper here is plain white, and the installed
    // app should not be the one surface still showing the old one. There is no
    // media-query form of this field, so it takes the light value; the meta tag
    // still swaps per scheme once the page is up.
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
