import { listPosts, listProjects } from '@/lib/content'
import { SITE_URL } from '@/config/site'
import { absoluteUrl, siteDescription, siteName } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import type { PostRecord, ProjectRecord } from '@/lib/content-types'

/** RSS 2.0 feed of the articles and project write-ups, in Thai — the site's primary locale. */

// Rendered per request, like the sitemap: the hourly ISR copy is what left
// sitemap.xml a day stale on Vercel. The CDN may hold it a minute, no more.
export const dynamic = 'force-dynamic'

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

type Entry = { path: string; record: PostRecord | ProjectRecord }

const published = ({ record }: Entry) => new Date(record.publishedAt ?? record.updatedAt).getTime()

function item({ path, record: post }: Entry): string {
  const url = absoluteUrl(path, FEED_LOCALE)
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(post.publishedAt ?? post.updatedAt)}</pubDate>
      <description>${escapeXml(post.summary ?? '')}</description>
    </item>`
}

export async function GET(): Promise<Response> {
  let entries: Entry[] = []
  try {
    const [posts, projects] = await Promise.all([
      listPosts({ locale: FEED_LOCALE }),
      listProjects({ locale: FEED_LOCALE }),
    ])
    entries = [
      ...posts.map((record) => ({ path: `/blog/${record.slug}`, record })),
      ...projects.map((record) => ({ path: `/projects/${record.slug}`, record })),
    ].sort((a, b) => published(b) - published(a))
  } catch (error) {
    console.error('[feed] could not read content, serving an empty feed:', error)
  }

  const feedUrl = `${SITE_URL}/feed.xml`
  const lastBuildDate = rfc822(entries[0]?.record.publishedAt ?? entries[0]?.record.updatedAt)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName(FEED_LOCALE))}</title>
    <link>${escapeXml(absoluteUrl('/blog', FEED_LOCALE))}</link>
    <description>${escapeXml(siteDescription(FEED_LOCALE))}</description>
    <language>${FEED_LOCALE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${entries.map(item).join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
