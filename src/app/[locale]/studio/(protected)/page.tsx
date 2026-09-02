import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { hasDatabase } from '@/lib/prisma'
import { StickerCard } from '@/components/ui/sticker-card'
import { ContentManager, type ManagedItem } from '@/components/studio/content-manager'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string
  slug: string
  locale: string
  status: string
  updatedAt: string
  featured: boolean
  tags: string[]
}

const toManaged = (r: Row): ManagedItem => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  locale: r.locale,
  status: r.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  updatedAt: r.updatedAt,
  featured: r.featured,
  tags: r.tags,
})

export default async function StudioDashboard({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('studio')

  // The studio manages every locale, not just the one the UI is in.
  const [posts, projects] = await Promise.all([
    Promise.all(routing.locales.map((code) => listPosts({ locale: code, includeDrafts: true })))
      .then((groups) => groups.flat()),
    Promise.all(routing.locales.map((code) => listProjects({ locale: code, includeDrafts: true })))
      .then((groups) => groups.flat()),
  ])

  return (
    <div className="space-y-12">
      {!hasDatabase && (
        <StickerCard tone="sun" className="p-5">
          <p className="font-display font-bold">Database not connected</p>
          <p className="text-ink-soft mt-1 text-sm">
            The lists below show bundled sample content and editing is disabled. Set{' '}
            <code className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code>{' '}
            and{' '}
            <code className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-xs">DIRECT_URL</code>{' '}
            in <code className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-xs">.env</code>,
            then run{' '}
            <code className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-xs">npm run db:push</code>.
          </p>
        </StickerCard>
      )}

      <ContentManager
        kind="posts"
        items={posts.map(toManaged)}
        locale={locale}
        title={t('posts')}
        newLabel={t('newPost')}
        newHref="/studio/posts/new"
        emptyLabel={t('noPosts')}
      />

      <ContentManager
        kind="projects"
        items={projects.map(toManaged)}
        locale={locale}
        title={t('projects')}
        newLabel={t('newProject')}
        newHref="/studio/projects/new"
        emptyLabel={t('noProjects')}
      />
    </div>
  )
}
