import { Elysia } from 'elysia'
import { WebStandardAdapter } from 'elysia/adapter/web-standard'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'
import type { PostRecord, ProjectRecord } from './content-types'
import type { SearchEntry } from './search'

type SearchPost = Pick<PostRecord, 'slug' | 'title' | 'summary' | 'tags' | 'publishedAt'>
type SearchProject = SearchPost & Pick<ProjectRecord, 'stack'>

interface PublicApiDependencies {
  listPosts: (options: { locale: Locale }) => Promise<SearchPost[]>
  listProjects: (options: { locale: Locale }) => Promise<SearchProject[]>
  checkDatabase: (() => Promise<unknown>) | null
}

/** Public, read-only routes. Next.js owns the HTTP server and the studio routes. */
export function createPublicApi(deps: PublicApiDependencies) {
  return new Elysia({ prefix: '/api', adapter: WebStandardAdapter })
    .onError(({ code }) => {
      if (code !== 'NOT_FOUND') return Response.json({ error: 'Internal server error' }, { status: 500 })
    })
    .get('/search', async ({ request }) => {
      const requested = new URL(request.url).searchParams.get('locale') ?? ''
      const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
      const [posts, projects] = await Promise.all([
        deps.listPosts({ locale }), deps.listProjects({ locale }),
      ])
      const entries: SearchEntry[] = [
        ...posts.map((p) => ({
          kind: 'post' as const, href: `/blog/${p.slug}`, title: p.title,
          summary: p.summary, tags: p.tags, publishedAt: p.publishedAt,
        })),
        ...projects.map((p) => ({
          kind: 'project' as const, href: `/projects/${p.slug}`, title: p.title,
          summary: p.summary, tags: p.tags, stack: p.stack, publishedAt: p.publishedAt,
        })),
      ]
      return Response.json(entries, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      })
    })
    .get('/health', async () => {
      const headers = { 'Cache-Control': 'public, s-maxage=15' }
      if (!deps.checkDatabase) return Response.json({ ok: false }, { status: 503, headers })
      const started = performance.now()
      const ms = () => Math.round(performance.now() - started)
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          deps.checkDatabase(),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('timeout')), 5000)
          }),
        ])
        return Response.json({ ok: true, db: { ok: true, ms: ms() } }, { headers })
      } catch {
        return Response.json({ ok: false, db: { ok: false, ms: ms() } }, { status: 503, headers })
      } finally {
        clearTimeout(timer)
      }
    })
}
