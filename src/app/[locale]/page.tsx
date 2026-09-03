import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import type { PostRecord, ProjectRecord } from '@/lib/content-types'
import { listPosts, listProjects } from '@/lib/content'
import { skillGroups, yearsOfExperience } from '@/config/site'
import { Container, Section, SectionHeading } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { ButtonLink } from '@/components/ui/button'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { MarqueeRow } from '@/components/motion/typewriter'
import { Hero } from '@/components/home/hero'
import { PostCard, ProjectCard } from '@/components/content/content-card'
import { TagLink } from '@/components/content/tag-link'
import { WebringBadge } from '@/components/layout/webring-badge'
import { ArrowRightIcon, ExternalLinkIcon } from '@/components/icons'
import { Squiggle } from '@/components/ui/decor'

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
    { key: 'experience', value: `${yearsOfExperience()}+`, tone: 'brand' as const },
    { key: 'projects', value: `${Math.max(3, projects.length)}`, tone: 'mint' as const },
    { key: 'stack', value: `${allSkills.length}`, tone: 'sun' as const },
    // Word values need a smaller size than the numerals or they overflow the card.
    { key: 'company', value: 'Thanes', tone: 'violet' as const, wide: true },
  ]

  return (
    <>
      <Hero roles={roles} />

      {/* ------------------------------ stats ------------------------------ */}
      <Section className="pt-0 sm:pt-0">
        <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <RevealItem key={stat.key}>
              <StickerCard
                tone={stat.tone}
                className="flex h-full flex-col justify-center p-5 text-center"
                interactive
              >
                <p
                  className={
                    stat.wide
                      ? 'font-display text-2xl leading-tight font-extrabold wrap-break-word sm:text-3xl'
                      : 'font-display text-4xl leading-[1.15] font-extrabold sm:text-5xl'
                  }
                >
                  {stat.value}
                </p>
                <p className="text-ink-soft mt-1 text-sm font-medium">
                  {t(`stats.${stat.key}` as 'stats.experience')}
                </p>
              </StickerCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ------------------------------ about ------------------------------ */}
      <Section className="py-8 sm:py-10">
        <Reveal>
          <StickerCard size="lg" className="relative overflow-hidden p-7 sm:p-10">
            <Squiggle className="text-brand absolute top-4 left-7 h-4 w-28 opacity-50 sm:left-10" />
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="text-2xl sm:text-3xl">{t('aboutTitle')}</h2>
                <p className="text-muted mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
                  {t('aboutBody')}
                </p>
              </div>
              <ButtonLink href="/about" variant="secondary">
                {t('aboutMore')}
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            </div>
          </StickerCard>
        </Reveal>
      </Section>

      {/* ------------------------------ skills ----------------------------- */}
      <Section>
        <SectionHeading eyebrow="Toolbox" title={t('skillsTitle')} description={t('skillsSubtitle')} />
        <Reveal className="space-y-3">
          <MarqueeRow items={allSkills} duration={46} />
          <MarqueeRow items={[...allSkills].reverse()} duration={54} reverse />
        </Reveal>

        <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <RevealItem key={group.id}>
              <StickerCard className="h-full p-5" interactive>
                <p className="font-display text-brand text-xs font-bold tracking-[0.14em] uppercase">
                  {tSkills(group.id)}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <TagLink tag={item} />
                    </li>
                  ))}
                </ul>
              </StickerCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ---------------------------- projects ----------------------------- */}
      <Section className="bg-paper-alt drawn-rule drawn-rule-top relative">
        <SectionHeading
          eyebrow="Work"
          title={t('projectsTitle')}
          description={t('projectsSubtitle')}
          action={
            <ButtonLink href="/projects" variant="secondary" size="sm">
              {tCommon('viewAll')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {projects.length > 0 ? (
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <RevealItem key={project.id} className="h-full">
                <ProjectCard project={project} index={i} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState title={tCommon('empty')} hint={tCommon('emptyHint')} />
        )}
      </Section>

      {/* ------------------------------ blog ------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Writing"
          title={t('blogTitle')}
          description={t('blogSubtitle')}
          action={
            <ButtonLink href="/blog" variant="secondary" size="sm">
              {tCommon('viewAll')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        {posts.length > 0 ? (
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <RevealItem key={post.id} className="h-full">
                <PostCard post={post} index={i} locale={locale} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState title={tCommon('empty')} hint={tCommon('emptyHint')} />
        )}
      </Section>

      {/* ---------------------------- most read ---------------------------- */}
      {popular.length > 0 && (
        <Section className="bg-paper-alt drawn-rule drawn-rule-top relative">
          <SectionHeading
            eyebrow="Popular"
            title={t('popularTitle')}
            description={t('popularSubtitle')}
          />
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

      {/* ----------------------------- webring ----------------------------- */}
      <Container className="pt-12 pb-16 sm:pt-16">
        <Reveal>
          <StickerCard tone="brand" size="lg" className="p-7 sm:p-10">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="bg-paper border-line grid size-20 shrink-0 place-items-center rounded-2xl border-2">
                <WebringBadge size={44} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl">{t('webringTitle')}</h2>
                <p className="text-ink-soft mt-2 max-w-xl leading-relaxed">{t('webringBody')}</p>
              </div>
              <ButtonLink
                href="https://webring.wonderful.software"
                variant="secondary"
                external
              >
                {t('webringCta')}
                <ExternalLinkIcon className="size-4" />
              </ButtonLink>
            </div>
          </StickerCard>
        </Reveal>
      </Container>
    </>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <StickerCard className="p-10 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="text-muted mt-2">{hint}</p>
    </StickerCard>
  )
}
