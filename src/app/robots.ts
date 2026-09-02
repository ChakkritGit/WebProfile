import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The studio is authenticated and the API surface has nothing to index.
        disallow: ['/studio', '/en/studio', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  }
}
