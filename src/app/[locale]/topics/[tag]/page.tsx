import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { findTagBySlug, tagSlug } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { StickerCard } from '@/components/ui/sticker-card'
import { ButtonLink } from '@/components/ui/button'
import { PostCard, ProjectCard } from '@/components/content/content-card'
import { TagIcon } from '@/components/icons'

export const revalidate = 3600

/** Every tag and stack entry that appears anywhere, for this locale. */
async function topicsFor(locale: Locale) {
  const [posts, projects] = await Promise.all([
    listPosts({ locale }),
    listProjects({ locale }),
  ])
  const labels = new Set<string>()
  for (const record of [...posts, ...projects]) record.tags.forEach((tag) => labels.add(tag))
  for (const project of projects) project.stack.forEach((tech) => labels.add(tech))
  return { posts, projects, labels: [...labels] }
}

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = []
  for (const locale of routing.locales) {
    const { labels } = await topicsFor(locale)
    for (const label of labels) params.push({ locale, tag: tagSlug(label) })
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>
}): Promise<Metadata> {
  const { locale, tag: slug } = await params
  const { labels } = await topicsFor(locale as Locale)
  const label = findTagBySlug(labels, slug) ?? decodeURIComponent(slug)
  const t = await getTranslations({ locale, namespace: 'tagSearch' })

  return buildMetadata({
    title: t('metaTitle', { tag: label }),
    description: t('subtitle', { tag: label }),
    path: `/topics/${slug}`,
    locale: locale as Locale,
  })
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>
}) {
  const { locale, tag: slug } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('tagSearch')
  const { posts, projects, labels } = await topicsFor(locale as Locale)

  // Unknown slugs render an empty state rather than 404 — a tag can disappear
  // when its last post is unpublished, and a hard 404 would be a worse answer.
  const label = findTagBySlug(labels, slug) ?? decodeURIComponent(slug)

  const matchedProjects = projects.filter(
    (project) => project.tags.includes(label) || project.stack.includes(label),
  )
  const matchedPosts = posts.filter((post) => post.tags.includes(label))
  const empty = matchedProjects.length === 0 && matchedPosts.length === 0

  return (
    <>
      <PageHeader title={t('title', { tag: label })} description={t('subtitle', { tag: label })}>
        <ButtonLink href="/topics" variant="secondary" size="sm" className="mt-5">
          <TagIcon className="size-4" />
          {t('backToAll')}
        </ButtonLink>
      </PageHeader>

      <Section className="space-y-12">
        {matchedProjects.length > 0 && (
          <div>
            <h2 className="mb-5 text-2xl">{t('projectsHeading')}</h2>
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matchedProjects.map((project, i) => (
                <RevealItem key={project.id} className="h-full">
                  <ProjectCard project={project} index={i} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        )}

        {matchedPosts.length > 0 && (
          <div>
            <h2 className="mb-5 text-2xl">{t('postsHeading')}</h2>
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matchedPosts.map((post, i) => (
                <RevealItem key={post.id} className="h-full">
                  <PostCard post={post} index={i} locale={locale} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        )}

        {empty && (
          <StickerCard className="p-12 text-center">
            <TagIcon aria-hidden className="text-muted mx-auto size-9" />
            <p className="font-display mt-4 text-xl font-bold">{t('empty', { tag: label })}</p>
            <ButtonLink href="/topics" variant="secondary" size="sm" className="mt-5">
              {t('backToAll')}
            </ButtonLink>
          </StickerCard>
        )}
      </Section>
    </>
  )
}
