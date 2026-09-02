import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { getPost, listPosts } from '@/lib/content'
import { absoluteUrl, buildMetadata } from '@/lib/seo'
import { profile } from '@/config/site'
import { ArticleShell } from '@/components/content/article-shell'
import { ViewTracker } from '@/components/content/view-tracker'
import { ClockIcon, EyeIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import { decodeParam } from '@/lib/slug'

export const revalidate = 3600

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
    author: { '@type': 'Person', name: profile.name, url: absoluteUrl('/') },
    publisher: { '@type': 'Person', name: profile.name },
    ...(post.coverImage ? { image: post.coverImage } : {}),
  }

  return (
    <>
      {/* The record's own locale, not the interface one: a Thai article read at
          `/ja/...` must still count against the Thai row, and `/api/views`
          matches on (slug, locale). Passing the UI locale dropped the view. */}
      <ViewTracker kind="post" slug={post.slug} locale={post.locale} />
      <script
        type="application/ld+json"
        // Serialised from our own data; `<` is escaped to prevent tag breakout.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <ArticleShell
        title={post.title}
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
            <span className="inline-flex items-center gap-1.5">
              <EyeIcon className="size-4" />
              {t('views', { count: post.views })}
            </span>
          </>
        }
      />
    </>
  )
}
