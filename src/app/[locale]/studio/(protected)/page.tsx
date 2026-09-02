import { getTranslations, setRequestLocale } from 'next-intl/server'
import { type Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { hasDatabase } from '@/lib/prisma'
import { StickerCard } from '@/components/ui/sticker-card'
import { ContentManager, type ManagedItem } from '@/components/studio/content-manager'
import { StudioTabs, type StudioTab } from '@/components/studio/studio-tabs'

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
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale } = await params
  const { tab } = await searchParams
  const active: StudioTab = tab === 'projects' ? 'projects' : 'posts'
  setRequestLocale(locale as Locale)

  const t = await getTranslations('studio')

  // One query per kind, every language, nothing collapsed. Fanning out over a
  // hardcoded list of locales got this wrong twice: mapping over the UI locales
  // listed English rows once per locale that reads them, and narrowing that list
  // hid the Japanese rows entirely — they stayed live at their URLs with no way
  // to edit or delete them from here.
  const [posts, projects] = await Promise.all([
    listPosts({ locale: locale as Locale, includeDrafts: true, allLocales: true }),
    listProjects({ locale: locale as Locale, includeDrafts: true, allLocales: true }),
  ])

  return (
    <div className="space-y-6">
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

      <StudioTabs
        active={active}
        counts={{ posts: posts.length, projects: projects.length }}
      />

      {active === 'posts' ? (
        <ContentManager
          kind="posts"
          items={posts.map(toManaged)}
          locale={locale}
          title={t('posts')}
          newLabel={t('newPost')}
          newHref="/studio/posts/new"
          emptyLabel={t('noPosts')}
        />
      ) : (
        <ContentManager
          kind="projects"
          items={projects.map(toManaged)}
          locale={locale}
          title={t('projects')}
          newLabel={t('newProject')}
          newHref="/studio/projects/new"
          emptyLabel={t('noProjects')}
        />
      )}
    </div>
  )
}
