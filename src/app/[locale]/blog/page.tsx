import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { collectTags, listPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { matchesQuery, paginate, parsePage } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { PostCard } from '@/components/content/content-card'
import { TagFilter } from '@/components/content/tag-filter'
import { SearchBox } from '@/components/content/search-box'
import { Pagination } from '@/components/content/pagination'
import { EmptyResults } from '@/components/content/empty-results'

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
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>
}) {
  const { locale } = await params
  const { tag, q = '', page: pageParam } = await searchParams
  setRequestLocale(locale as Locale)

  const t = await getTranslations('blog')
  const tCommon = await getTranslations('common')

  const all = await listPosts({ locale: locale as Locale })
  const tags = collectTags(all)

  const filtered = all
    .filter((post) => (tag ? post.tags.includes(tag) : true))
    .filter((post) => matchesQuery(post, q))

  const { items, page, totalPages, total } = paginate(filtered, parsePage(pageParam), PER_PAGE)

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Section>
        <div className="space-y-5">
          <SearchBox initialQuery={q} tag={tag} className="max-w-xl" />
          {tags.length > 0 && (
            <TagFilter tags={tags} active={tag} allLabel={t('allTags')} basePath="/blog" query={q} />
          )}
          <p aria-live="polite" className="text-muted text-sm">
            {tCommon('resultsCount', { count: total })}
          </p>
        </div>

        {items.length > 0 ? (
          <>
            <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post, i) => (
                <RevealItem key={post.id} className="h-full">
                  <PostCard post={post} index={i} locale={locale} />
                </RevealItem>
              ))}
            </RevealGroup>
            <Pagination page={page} totalPages={totalPages} basePath="/blog" query={{ tag, q }} />
          </>
        ) : (
          <EmptyResults query={q} hasFilters={Boolean(q || tag)} basePath="/blog" fallback={t('empty')} />
        )}
      </Section>
    </>
  )
}
