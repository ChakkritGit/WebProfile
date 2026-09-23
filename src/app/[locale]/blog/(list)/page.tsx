import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { collectTags, listPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { applyDateFilter, matchesQuery, paginate, parseDateFilter, parsePage, publishedDates } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { PostCard } from '@/components/content/content-card'
import { TagFilter } from '@/components/content/tag-filter'
import { SearchBox } from '@/components/content/search-box'
import { Pagination } from '@/components/content/pagination'
import { EmptyResults } from '@/components/content/empty-results'
import { DateFilter } from '@/components/content/date-filter'

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
  const t = await getTranslations({ locale, namespace: 'blog' })
  return {
    ...buildMetadata({
      title: t('title'),
      description: t('subtitle'),
      path: '/blog',
      locale: locale as Locale,
    }),
    alternates: {
      canonical: locale === 'th' ? '/blog' : '/en/blog',
      types: { 'application/rss+xml': '/feed.xml' },
    },
  }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; q?: string; page?: string; year?: string; month?: string; sort?: string }>
}) {
  const { locale } = await params
  const { tag, q = '', page: pageParam, ...dateParams } = await searchParams
  const dateFilter = parseDateFilter(dateParams)
  // What each control carries through when another one changes.
  const dates = { year: dateParams.year, month: dateParams.month, sort: dateParams.sort }

  const t = await getTranslations('blog')
  const tCommon = await getTranslations('common')

  const all = await listPosts({ locale: locale as Locale })
  const tags = collectTags(all)

  const filtered = applyDateFilter(
    all
      .filter((post) => (tag ? post.tags.includes(tag) : true))
      .filter((post) => matchesQuery(post, q)),
    dateFilter,
  )

  const { items, page, totalPages, total } = paginate(filtered, parsePage(pageParam), PER_PAGE)

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Section>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-3">
            <SearchBox initialQuery={q} keep={{ tag, ...dates }} className="w-full max-w-xl" />
            <DateFilter filter={dateFilter} dates={publishedDates(all)} keep={{ tag, q }} />
          </div>
          {tags.length > 0 && (
            <TagFilter tags={tags} active={tag} allLabel={t('allTags')} basePath="/blog" query={q} keep={dates} />
          )}
          <p aria-live="polite" className="text-muted text-sm">
            {tCommon('resultsCount', { count: total })}
          </p>
        </div>

        {items.length > 0 ? (
          <>
            <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post, i) => (
                <RevealItem key={post.id} className="h-full" firstPaint={i < 3}>
                  <PostCard post={post} index={i} locale={locale} priority={i < 3} />
                </RevealItem>
              ))}
            </RevealGroup>
            <Pagination page={page} totalPages={totalPages} basePath="/blog" query={{ tag, q, ...dates }} />
          </>
        ) : (
          <EmptyResults query={q} hasFilters={Boolean(q || tag || dateFilter.year || dateFilter.month)} basePath="/blog" fallback={t('empty')} />
        )}
      </Section>
    </>
  )
}
