import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import type { PostRecord, ProjectRecord } from '@/lib/content-types'
import { listPosts, listProjects } from '@/lib/content'
import { buildTopicMap } from '@/lib/topics'
import { absoluteUrl, authorJsonLd, siteDescription, siteName } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/ui/section'
import { ButtonLink } from '@/components/ui/button'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { PostCard, PostRow, ProjectCard } from '@/components/content/content-card'
import { TagOrb } from '@/components/home/tag-orb'
import { HeroArt, HeroArtScript } from '@/components/home/collage-backdrop'
import { HoverScramble } from '@/components/motion/text-scramble'
import { ArrowRightIcon } from '@/components/icons'

/**
 * Static, but not for ever.
 *
 * These pages list content that changes when something is published, and a
 * publish clears them directly (see `revalidateContent`). This is the floor
 * under that: if a purge is ever missed, the page repairs itself within the
 * minute instead of serving the same copy until the next deploy.
 */
export const revalidate = 60

const LATEST = 6

/**
 * The front page is the articles and the projects — the site as a place to
 * read. Who wrote them is one paragraph here and the whole of `/about`.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // `[locale]` matches any single segment, so this is where a URL like
  // `/nope.txt` — one that skipped the proxy and never had a locale — arrives.
  // Refusing it here rather than in the layout is what lets the site's own
  // not-found page render, inside the site's own layout.
  if (!hasLocale(routing.locales, locale)) notFound()

  const t = await getTranslations('home')

  const [posts, projects] = await Promise.all([
    listPosts({ locale: locale as Locale }),
    listProjects({ locale: locale as Locale }),
  ])

  // One combined "most read" strip: whichever three pieces have the most views,
  // regardless of kind. Anything never opened is left out entirely.
  const popular = [
    ...posts.map((p) => ({ kind: 'post' as const, item: p })),
    ...projects.map((p) => ({ kind: 'project' as const, item: p })),
  ]
    .filter((entry) => entry.item.views > 0)
    .sort((a, b) => b.item.views - a.item.views)
    .slice(0, 3)

  const latest = posts.slice(0, LATEST)
  // Featured first, then the rest by date — so the strip is never empty just
  // because nothing has been marked featured.
  const shownProjects = [...projects]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3)
  const topics = buildTopicMap(posts, projects)

  return (
    <>
      <JsonLd locale={locale as Locale} posts={latest} projects={shownProjects} />

      {/* ------------------------------ intro ------------------------------ */}
      <HeroArtScript />
      {/* At least one full screen under the header (svh, so a phone's
          collapsing toolbar does not leave a gap), content centred in it; a
          phone whose content is taller simply gets a taller section. */}
      <section className="border-line relative flex min-h-[calc(100svh-var(--header-h))] items-center overflow-hidden border-b">
        <HeroArt />
        <Container className="relative grid items-center gap-10 pt-8 pb-16 sm:pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <div className="hero-text">
            <p className="label-mono text-brand-strong">{t('introEyebrow')}</p>
            <h1 className="mt-5 text-[clamp(3rem,11vw,6.5rem)] uppercase lg:text-[clamp(4rem,6.8vw,6.5rem)]">
              {t('introTitle')}
            </h1>
            <p className="text-ink-soft mt-6 max-w-xl text-lg leading-relaxed">{t('introBody')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/blog" size="lg">
                <HoverScramble text={t('ctaArticles')} />
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <ButtonLink href="/about" variant="outline" size="lg">
                {t('ctaAbout')}
              </ButtonLink>
            </div>
          </div>

          {topics.nodes.length > 0 && (
            <div>
              <TagOrb map={topics} />
              <div className="hero-caption border-line bg-surface flex items-baseline justify-between gap-4 border border-t-0 px-4 py-3">
                <p className="text-muted text-sm">{t('orbSubtitle')}</p>
                <ButtonLink href="/topics" variant="ghost" size="sm" className="shrink-0 px-0">
                  {t('allTopics')}
                  <ArrowRightIcon className="size-3.5" />
                </ButtonLink>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ---------------------------- most read ---------------------------- */}
      {popular.length > 0 && (
        <Section className="border-line border-b">
          <SectionHeading eyebrow={`01 — ${t('popularTitle')}`} title={t('popularTitle')} description={t('popularSubtitle')} />
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map(({ kind, item }, i) => (
              <RevealItem key={`${kind}-${item.id}`} className="h-full">
                {kind === 'post' ? (
                  <PostCard post={item as PostRecord} index={i} locale={locale} />
                ) : (
                  <ProjectCard project={item as ProjectRecord} index={i} />
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      {/* ----------------------------- latest ------------------------------ */}
      <Section className="border-line border-b">
        <SectionHeading
          eyebrow={`02 — ${t('latestTitle')}`}
          title={t('latestTitle')}
          description={t('latestSubtitle')}
          action={
            <ButtonLink href="/blog" variant="outline" size="sm">
              {t('allArticles')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {latest.length > 0 ? (
          <div className="border-line border-t">
            {latest.map((post) => (
              <PostRow key={post.id} post={post} locale={locale} />
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* ---------------------------- projects ----------------------------- */}
      <Section>
        <SectionHeading
          eyebrow={`03 — ${t('projectsTitle')}`}
          title={t('projectsTitle')}
          description={t('projectsSubtitle')}
          action={
            <ButtonLink href="/projects" variant="outline" size="sm">
              {t('allProjects')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {shownProjects.length > 0 ? (
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shownProjects.map((project, i) => (
              <RevealItem key={project.id} className="h-full">
                <ProjectCard project={project} index={i} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <Empty />
        )}
      </Section>
    </>
  )
}

async function Empty() {
  const t = await getTranslations('common')
  return (
    <div className="border-line border p-10 text-center">
      <p className="text-xl">{t('empty')}</p>
      <p className="text-muted mt-2">{t('emptyHint')}</p>
    </div>
  )
}

/**
 * What Google needs to show articles and projects in its results, not only the
 * home page: the site with its search box, and the two lists as `ItemList`s of
 * `BlogPosting` and `Article`. Each detail page carries its own full entry;
 * these point at them. The site itself is one `WebSite` with one name on every
 * locale: Google reads the site name from the domain root only, and falls back
 * to the bare domain when the pages disagree.
 */
function JsonLd({
  locale,
  posts,
  projects,
}: {
  locale: Locale
  posts: PostRecord[]
  projects: ProjectRecord[]
}) {
  const root = absoluteUrl('/', routing.defaultLocale)
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${root}#website`,
      url: root,
      name: siteName('en'),
      alternateName: siteName('th'),
      description: siteDescription(locale),
      inLanguage: locale,
      author: authorJsonLd(locale),
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search', locale)}?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'ItemList',
      name: 'Articles',
      itemListElement: posts.map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.summary ?? undefined,
          url: absoluteUrl(`/blog/${post.slug}`, locale),
          datePublished: post.publishedAt ?? undefined,
          image: post.coverImage ?? undefined,
          keywords: post.tags.join(', ') || undefined,
          author: authorJsonLd(locale),
        },
      })),
    },
    {
      '@type': 'ItemList',
      name: 'Projects',
      itemListElement: projects.map((project, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Article',
          headline: project.title,
          description: project.summary ?? undefined,
          url: absoluteUrl(`/projects/${project.slug}`, locale),
          datePublished: project.publishedAt ?? undefined,
          image: project.coverImage ?? undefined,
          keywords: [...project.tags, ...project.stack].join(', ') || undefined,
          author: authorJsonLd(locale),
        },
      })),
    },
  ]
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'),
      }}
    />
  )
}
