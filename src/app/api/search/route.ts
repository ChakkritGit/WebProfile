import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import type { SearchEntry } from '@/lib/search'

/**
 * GET /api/search?locale=th — everything published, as a search index.
 *
 * The instant search in the navbar filters this in the browser rather than
 * asking the server once per keystroke: the whole corpus is a few kilobytes,
 * and a round trip to Supabase in Tokyo is 150ms a keystroke would feel.
 * ponytail: ships the whole index; page it server-side if it passes ~1,000 entries.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('locale') ?? ''
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const [posts, projects] = await Promise.all([listPosts({ locale }), listProjects({ locale })])

  const entries: SearchEntry[] = [
    ...posts.map((p) => ({
      kind: 'post' as const,
      href: `/blog/${p.slug}`,
      title: p.title,
      summary: p.summary,
      tags: p.tags,
      publishedAt: p.publishedAt,
    })),
    ...projects.map((p) => ({
      kind: 'project' as const,
      href: `/projects/${p.slug}`,
      title: p.title,
      summary: p.summary,
      tags: p.tags,
      stack: p.stack,
      publishedAt: p.publishedAt,
    })),
  ]

  return Response.json(entries, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
