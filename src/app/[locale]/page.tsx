import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { skillGroups, yearsOfExperience } from '@/config/site'
import { Container, Section, SectionHeading } from '@/components/ui/section'
import { ButtonLink } from '@/components/ui/button'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { MarqueeRow } from '@/components/motion/typewriter'
import { Hero } from '@/components/home/hero'
import { EntryRow } from '@/components/home/entry-row'
import { TagLink } from '@/components/content/tag-link'
import { WebringBadge } from '@/components/layout/webring-badge'
import { ArrowRightIcon, ExternalLinkIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const t = await getTranslations('home')
  const tCommon = await getTranslations('common')
  const tSkills = await getTranslations('skills')

  const [projects, posts, popularPosts, popularProjects] = await Promise.all([
    listProjects({ locale: locale as Locale, limit: 3, featuredOnly: true }),
    listPosts({ locale: locale as Locale, limit: 3, featuredOnly: true }),
    listPosts({ locale: locale as Locale, orderBy: 'views' }),
    listProjects({ locale: locale as Locale, orderBy: 'views' }),
  ])

  // One combined "most read" strip: whichever three items have the most views,
  // regardless of kind. Anything never opened is left out entirely.
  const popular = [
    ...popularPosts.map((p) => ({ kind: 'post' as const, item: p })),
    ...popularProjects.map((p) => ({ kind: 'project' as const, item: p })),
  ]
    .filter((entry) => entry.item.views > 0)
    .sort((a, b) => b.item.views - a.item.views)
    .slice(0, 3)

  const roles = t.raw('roles') as string[]
  const allSkills = skillGroups.flatMap((group) => [...group.items])

  const stats = [
    { key: 'experience', value: `${yearsOfExperience()}+` },
    { key: 'projects', value: `${Math.max(3, projects.length)}` },
    { key: 'stack', value: `${allSkills.length}` },
    { key: 'company', value: 'Thanes' },
  ].map((stat) => ({ ...stat, label: t(`stats.${stat.key}` as 'stats.experience') }))

  return (
    <>
      {/* The figures now finish the opening rather than starting a section of
          their own; the hero takes them so the fold carries the whole claim. */}
      <Hero roles={roles} stats={stats} />

      {/* ------------------------------ about ------------------------------ */}
      <Section className="border-line border-t py-14 sm:py-16">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">{t('aboutTitle')}</h2>
              <ButtonLink href="/about" variant="ghost" size="sm" className="mt-3 -ml-3">
                {t('aboutMore')}
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            </div>
            <p className="text-muted max-w-2xl text-lg leading-relaxed text-pretty">
              {t('aboutBody')}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ---------------------------- projects ----------------------------- */}
      <Section className="border-line border-t py-14 sm:py-16">
        <SectionHeading
          eyebrow="Work"
          title={t('projectsTitle')}
          description={t('projectsSubtitle')}
          action={
            <ButtonLink href="/projects" variant="ghost" size="sm">
              {tCommon('viewAll')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {projects.length > 0 ? (
          <RevealGroup className="border-line mt-2 border-b">
            {projects.map((project, i) => (
              <RevealItem key={project.id}>
                <EntryRow
                  href={`/projects/${project.slug}`}
                  index={i}
                  title={project.title}
                  summary={project.summary}
                  meta={[project.year ? String(project.year) : null, project.role, project.stack.slice(0, 3).join(', ')]}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState title={tCommon('empty')} hint={tCommon('emptyHint')} />
        )}
      </Section>

      {/* ------------------------------ blog ------------------------------- */}
      <Section className="border-line border-t py-14 sm:py-16">
        <SectionHeading
          eyebrow="Writing"
          title={t('blogTitle')}
          description={t('blogSubtitle')}
          action={
            <ButtonLink href="/blog" variant="ghost" size="sm">
              {tCommon('viewAll')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {posts.length > 0 ? (
          <RevealGroup className="border-line mt-2 border-b">
            {posts.map((post, i) => (
              <RevealItem key={post.id}>
                <EntryRow
                  href={`/blog/${post.slug}`}
                  index={i}
                  title={post.title}
                  summary={post.summary}
                  meta={[formatDate(post.publishedAt, locale), post.tags.slice(0, 2).join(', ')]}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState title={tCommon('empty')} hint={tCommon('emptyHint')} />
        )}
      </Section>

      {/* ---------------------------- most read ----------------------------
          Kept as rows too, so the page reads as one list of work broken into
          three questions — what I built, what I wrote, what people actually
          opened — rather than three differently-shaped galleries. */}
      {popular.length > 0 && (
        <Section className="border-line border-t py-14 sm:py-16">
          <SectionHeading
            eyebrow="Popular"
            title={t('popularTitle')}
            description={t('popularSubtitle')}
          />
          <RevealGroup className="border-line mt-2 border-b">
            {popular.map(({ kind, item }, i) => (
              <RevealItem key={`${kind}-${item.id}`}>
                <EntryRow
                  href={kind === 'post' ? `/blog/${item.slug}` : `/projects/${item.slug}`}
                  index={i}
                  title={item.title}
                  summary={item.summary}
                  meta={[
                    kind === 'post' ? t('blogTitle') : t('projectsTitle'),
                    `${item.views}`,
                  ]}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      {/* ------------------------------ skills -----------------------------
          Moved below the work. It answers "with what", which is a question
          somebody asks after they have seen what was made, not before. */}
      <Section className="border-line border-t py-14 sm:py-16">
        <SectionHeading eyebrow="Toolbox" title={t('skillsTitle')} description={t('skillsSubtitle')} />
        <Reveal className="space-y-3">
          <MarqueeRow items={allSkills} duration={46} />
          <MarqueeRow items={[...allSkills].reverse()} duration={54} reverse />
        </Reveal>

        <RevealGroup className="border-line mt-10 border-b">
          {skillGroups.map((group) => (
            <RevealItem key={group.id}>
              <div className="border-line grid gap-3 border-t py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <p className="text-muted text-sm font-semibold tracking-wide uppercase">
                  {tSkills(group.id)}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <TagLink tag={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ----------------------------- webring ----------------------------- */}
      <Container className="border-line border-t py-14 sm:py-16">
        <Reveal>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="border-line grid size-16 shrink-0 place-items-center rounded-sm border">
              <WebringBadge size={36} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold sm:text-2xl">{t('webringTitle')}</h2>
              <p className="text-muted mt-2 max-w-xl leading-relaxed">{t('webringBody')}</p>
            </div>
            <ButtonLink href="https://webring.wonderful.software" variant="secondary" external>
              {t('webringCta')}
              <ExternalLinkIcon className="size-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border-line mt-2 border-t border-b py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted mt-2 text-sm">{hint}</p>
    </div>
  )
}
