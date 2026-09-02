import { listPosts } from '@/lib/content'
import { SITE_URL } from '@/config/site'
import { absoluteUrl, siteDescription, siteName } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import type { PostRecord } from '@/lib/content-types'

/** RSS 2.0 feed of the Thai blog — the site's primary locale. */

export const revalidate = 3600

const FEED_LOCALE = routing.defaultLocale

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char])
}

/** RSS wants RFC-822 dates; `toUTCString()` emits the RFC-1123 profile of it. */
function rfc822(value: string | null | undefined): string {
  const date = value ? new Date(value) : new Date()
  return (Number.isNaN(date.getTime()) ? new Date() : date).toUTCString()
}

function item(post: PostRecord): string {
  const url = absoluteUrl(`/blog/${post.slug}`, FEED_LOCALE)
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(post.publishedAt ?? post.updatedAt)}</pubDate>
      <description>${escapeXml(post.summary ?? '')}</description>
    </item>`
}

export async function GET(): Promise<Response> {
  let posts: PostRecord[] = []
  try {
    posts = await listPosts({ locale: FEED_LOCALE })
  } catch (error) {
    console.error('[feed] could not read posts, serving an empty feed:', error)
  }

  const feedUrl = `${SITE_URL}/feed.xml`
  const lastBuildDate = rfc822(posts[0]?.publishedAt ?? posts[0]?.updatedAt)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName(FEED_LOCALE))}</title>
    <link>${escapeXml(absoluteUrl('/blog', FEED_LOCALE))}</link>
    <description>${escapeXml(siteDescription(FEED_LOCALE))}</description>
    <language>${FEED_LOCALE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${posts.map(item).join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
