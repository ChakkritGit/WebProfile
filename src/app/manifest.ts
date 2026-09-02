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
    theme_color: '#FF5A5F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
