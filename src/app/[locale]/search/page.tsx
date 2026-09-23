import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { matchesQuery } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { SearchBox } from '@/components/content/search-box'
import { PostRow, ProjectCard } from '@/components/content/content-card'

/**
 * Every article and project matching `?q=`, with the box still on the page so
 * the next query is typed here rather than by reopening the dialog — the way a
 * search engine's results page works.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search' })
  return {
    ...buildMetadata({ title: t('title'), description: t('subtitle'), path: '/search', locale: locale as Locale }),
    // A results page is a different page for every query; none of them belong in an index.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const { q = '' } = await searchParams
  const query = q.trim()
  const t = await getTranslations('search')
  const tCommon = await getTranslations('common')

  const [posts, projects] = query
    ? await Promise.all([listPosts({ locale: locale as Locale }), listProjects({ locale: locale as Locale })])
    : [[], []]
  const postHits = posts.filter((post) => matchesQuery(post, query))
  const projectHits = projects.filter((project) => matchesQuery(project, query))
  const total = postHits.length + projectHits.length

  return (
    <>
      <PageHeader title={query ? t('resultsFor', { query }) : t('title')} description={t('subtitle')}>
        <SearchBox initialQuery={query} className="mt-8 max-w-2xl" autoFocus={!query} />
        {query && (
          <p aria-live="polite" className="text-muted mt-4 font-mono text-xs uppercase">
            {tCommon('resultsCount', { count: total })}
          </p>
        )}
      </PageHeader>

      <Section>
        {!query && <p className="text-muted">{t('prompt')}</p>}
        {query && total === 0 && <p className="text-muted text-lg">{t('empty', { query })}</p>}

        {postHits.length > 0 && (
          <section aria-labelledby="hits-articles">
            <h2 id="hits-articles" className="mb-6 flex items-baseline gap-3 text-3xl sm:text-4xl">
              {t('articlesTitle')}
              <span className="text-brand-strong font-mono text-base">{postHits.length}</span>
            </h2>
            <div className="border-line border-t">
              {postHits.map((post) => (
                <PostRow key={post.id} post={post} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {projectHits.length > 0 && (
          <section aria-labelledby="hits-projects" className={postHits.length > 0 ? 'mt-16' : ''}>
            <h2 id="hits-projects" className="mb-6 flex items-baseline gap-3 text-3xl sm:text-4xl">
              {t('projectsTitle')}
              <span className="text-brand-strong font-mono text-base">{projectHits.length}</span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projectHits.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </section>
        )}
      </Section>
    </>
  )
}
