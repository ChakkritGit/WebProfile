import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { getProject, listProjects } from '@/lib/content'
import { absoluteUrl, buildMetadata } from '@/lib/seo'
import { profile } from '@/config/site'
import { ArticleShell } from '@/components/content/article-shell'
import { StickerCard } from '@/components/ui/sticker-card'
import { TagLink } from '@/components/content/tag-link'
import { ButtonLink } from '@/components/ui/button'
import { ExternalLinkIcon, GitHubIcon } from '@/components/icons'

export const revalidate = 3600

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    const projects = await listProjects({ locale })
    params.push(...projects.map((project) => ({ locale, slug: project.slug })))
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const project = await getProject(slug, locale as Locale)
  if (!project) return {}

  return buildMetadata({
    title: project.title,
    description: project.summary ?? undefined,
    path: `/projects/${project.slug}`,
    ogImagePath: `/projects/${project.slug}/opengraph-image`,
    locale: locale as Locale,
    type: 'article',
    publishedTime: project.publishedAt ?? undefined,
    tags: project.tags,
    image: project.coverImage ?? undefined,
  })
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale as Locale)

  const project = await getProject(slug, locale as Locale)
  if (!project) notFound()

  const t = await getTranslations('projects')
  const url = absoluteUrl(`/projects/${project.slug}`, locale as Locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary ?? undefined,
    dateCreated: project.publishedAt ?? undefined,
    inLanguage: locale,
    keywords: [...project.tags, ...project.stack].join(', '),
    url,
    creator: { '@type': 'Person', name: profile.name, url: absoluteUrl('/') },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ArticleShell
        title={project.title}
        content={project.content}
        tags={project.tags}
        backHref="/projects"
        backLabelKey="projects"
        shareUrl={url}
        meta={
          <>
            {project.year && (
              <span>
                {t('yearLabel')}: <strong className="text-ink">{project.year}</strong>
              </span>
            )}
            {project.role && (
              <span>
                {t('roleLabel')}: <strong className="text-ink">{project.role}</strong>
              </span>
            )}
          </>
        }
        aside={
          <StickerCard tone="mint" className="mb-8 p-5">
            {project.summary && <p className="leading-relaxed">{project.summary}</p>}

            {project.stack.length > 0 && (
              <>
                <p className="font-display mt-4 text-xs font-bold tracking-[0.12em] uppercase">
                  {t('stackLabel')}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <li key={tech}>
                      <TagLink tag={tech} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(project.liveUrl || project.repoUrl) && (
              <div className="mt-5 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <ButtonLink href={project.liveUrl} size="sm" external>
                    <ExternalLinkIcon className="size-4" />
                    {t('linkLive')}
                  </ButtonLink>
                )}
                {project.repoUrl && (
                  <ButtonLink href={project.repoUrl} size="sm" variant="secondary" external>
                    <GitHubIcon className="size-4" />
                    {t('linkRepo')}
                  </ButtonLink>
                )}
              </div>
            )}
          </StickerCard>
        }
      />
    </>
  )
}
