import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { getPost, listPosts } from '@/lib/content'
import { absoluteUrl, buildMetadata, authorJsonLd } from '@/lib/seo'
import { ArticleShell } from '@/components/content/article-shell'
import { ViewCount } from '@/components/content/view-count'
import { ClockIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import { decodeParam } from '@/lib/slug'

/**
 * A minute: these pages show view counts.
 *
 * Pages are also cleared on publish (see `revalidateContent`). A day was right on
 * Vercel, where every regeneration was a paid ISR write; on the VPS one is a
 * couple of database reads. At a day the home page showed yesterday's count
 * while the article showed it first and then the live one from `ViewCount`, so
 * the same post carried two numbers.
 */
export const revalidate = 60

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    const posts = await listPosts({ locale })
    params.push(...posts.map((post) => ({ locale, slug: post.slug })))
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  const post = await getPost(slug, locale as Locale)
  if (!post) return {}

  return buildMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: `/blog/${post.slug}`,
    ogImagePath: `/blog/${post.slug}/opengraph-image`,
    locale: locale as Locale,
    type: 'article',
    publishedTime: post.publishedAt ?? undefined,
    tags: post.tags,
    image: post.coverImage ?? undefined,
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)

  const post = await getPost(slug, locale as Locale)
  if (!post) notFound()

  const t = await getTranslations('common')
  const url = absoluteUrl(`/blog/${post.slug}`, locale as Locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    inLanguage: locale,
    keywords: post.tags.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: authorJsonLd(locale as Locale),
    publisher: authorJsonLd(locale as Locale),
    ...(post.coverImage ? { image: post.coverImage } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Serialised from our own data; `<` is escaped to prevent tag breakout.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <ArticleShell
        title={post.title}
        lang={post.locale}
        content={post.content}
        tags={post.tags}
        backHref="/blog"
        backLabelKey="blog"
        shareUrl={url}
        coverImage={post.coverImage}
        meta={
          <>
            <time dateTime={post.publishedAt ?? undefined}>
              {t('publishedOn', { date: formatDate(post.publishedAt, locale) })}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              {t('minuteRead', { minutes: post.readingMinutes })}
            </span>
            <ViewCount kind="post" slug={post.slug} locale={post.locale} initial={post.views} />
          </>
        }
      />
    </>
  )
}
