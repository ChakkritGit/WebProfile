import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { collectTags, listProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { matchesQuery, paginate, parsePage } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { ProjectCard } from '@/components/content/content-card'
import { TagFilter } from '@/components/content/tag-filter'
import { SearchBox } from '@/components/content/search-box'
import { Pagination } from '@/components/content/pagination'
import { EmptyResults } from '@/components/content/empty-results'

/**
 * Static, but not for ever.
 *
 * These pages list content that changes when something is published, and a
 * publish clears them directly (see `revalidateContent`). This is the floor
 * under that: if a purge is ever missed, the page repairs itself within the
 * minute instead of serving the same copy until the next deploy.
 */
export const revalidate = 60

const PER_PAGE = 9

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  return buildMetadata({
    title: t('title'),
    description: t('subtitle'),
    path: '/projects',
    locale: locale as Locale,
  })
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>
}) {
  const { locale } = await params
  const { tag, q = '', page: pageParam } = await searchParams

  const t = await getTranslations('projects')
  const tCommon = await getTranslations('common')

  const all = await listProjects({ locale: locale as Locale })
  const tags = collectTags(all)

  const filtered = all
    .filter((project) => (tag ? project.tags.includes(tag) : true))
    .filter((project) => matchesQuery(project, q))

  const { items, page, totalPages, total } = paginate(filtered, parsePage(pageParam), PER_PAGE)

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Section>
        <div className="space-y-5">
          <SearchBox initialQuery={q} tag={tag} className="max-w-xl" />
          {tags.length > 0 && (
            <TagFilter
              tags={tags}
              active={tag}
              allLabel={t('filterAll')}
              basePath="/projects"
              query={q}
            />
          )}
          <p aria-live="polite" className="text-muted text-sm">
            {tCommon('resultsCount', { count: total })}
          </p>
        </div>

        {items.length > 0 ? (
          <>
            <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((project, i) => (
                <RevealItem key={project.id} className="h-full" firstPaint={i < 3}>
                  <ProjectCard project={project} index={i} priority={i < 3} />
                </RevealItem>
              ))}
            </RevealGroup>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/projects"
              query={{ tag, q }}
            />
          </>
        ) : (
          <EmptyResults query={q} hasFilters={Boolean(q || tag)} basePath="/projects" fallback={t('empty')} />
        )}
      </Section>
    </>
  )
}
