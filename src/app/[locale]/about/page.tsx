import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import {
  education,
  experience,
  languages,
  profile,
  skillGroups,
  yearsOfExperience,
} from '@/config/site'
import { Container, PageHeader, Section, SectionHeading } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { TagLink } from '@/components/content/tag-link'
import { ButtonLink } from '@/components/ui/button'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import {
  BriefcaseIcon,
  CapIcon,
  DownloadIcon,
  GlobeIcon,
  LayersIcon,
  MapPinIcon,
} from '@/components/icons'
import { formatMonthYear } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: locale === 'th' ? '/about' : '/en/about' },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('about')
  const tSkills = await getTranslations('skills')
  const tCommon = await getTranslations('common')

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')}>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={profile.resume} external download>
            <DownloadIcon className="size-4" />
            {t('downloadResume')}
          </ButtonLink>
          <span className="sticker-sm bg-surface inline-flex items-center gap-2 px-4 py-2 text-sm">
            <MapPinIcon className="text-brand size-4" />
            {profile.location}
          </span>
        </div>
      </PageHeader>

      {/* ----------------------------- summary ----------------------------- */}
      <Section className="pb-6 sm:pb-8">
        <Reveal>
          <StickerCard size="lg" tone="sun" className="p-7 sm:p-9">
            <h2 className="text-2xl">{t('summaryTitle')}</h2>
            <p className="text-ink-soft mt-3 text-base leading-[1.85] text-pretty sm:text-lg">
              {t('summaryBody', { years: yearsOfExperience(), company: profile.company })}
            </p>
          </StickerCard>
        </Reveal>
      </Section>

      {/* ---------------------------- experience --------------------------- */}
      <Section className="py-8 sm:py-10">
        <SectionHeading eyebrow="Career" title={t('experienceTitle')} />
        <RevealGroup className="space-y-5">
          {experience.map((job) => (
            <RevealItem key={job.id}>
              <StickerCard className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="bg-brand-soft border-line grid size-12 shrink-0 place-items-center rounded-xl border-2">
                    <BriefcaseIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl">
                      {t(`jobs.${job.id}.role` as 'jobs.thanes.role')}
                    </h3>
                    <p className="text-brand font-display font-semibold">{job.company}</p>
                    <p className="text-muted mt-1 text-sm">
                      {formatMonthYear(job.start, locale)} —{' '}
                      {job.end ? formatMonthYear(job.end, locale) : tCommon('present')}
                    </p>
                    <p className="text-ink-soft mt-3 leading-relaxed">
                      {t(`jobs.${job.id}.summary` as 'jobs.thanes.summary')}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {job.stack.map((tech) => (
                        <li key={tech}>
                          <TagLink tag={tech} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </StickerCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ---------------------------- education ---------------------------- */}
      <Section className="py-8 sm:py-10">
        <SectionHeading eyebrow="Study" title={t('educationTitle')} />
        <RevealGroup className="space-y-5">
          {education.map((school) => (
            <RevealItem key={school.id}>
              <StickerCard className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="bg-mint-soft border-line grid size-12 shrink-0 place-items-center rounded-xl border-2">
                    <CapIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl">
                      {t(`schools.${school.id}.degree` as 'schools.nrru.degree')}
                    </h3>
                    <p className="text-brand font-display font-semibold">
                      {t(`schools.${school.id}.school` as 'schools.nrru.school')}
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      {formatMonthYear(school.start, locale)} — {formatMonthYear(school.end, locale)}
                      {' · '}
                      {t('gpa', { gpa: school.gpa })}
                    </p>
                  </div>
                </div>
              </StickerCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ------------------------------ skills ----------------------------- */}
      <Section className="py-8 sm:py-10">
        <SectionHeading eyebrow="Stack" title={t('skillsTitle')} />
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <RevealItem key={group.id}>
              <StickerCard className="h-full p-6" interactive>
                <p className="font-display flex items-center gap-2 text-sm font-bold tracking-[0.12em] uppercase">
                  <LayersIcon className="text-brand size-4" />
                  {tSkills(group.id)}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
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

      {/* ----------------------------- languages --------------------------- */}
      <Container className="pb-16">
        <SectionHeading eyebrow="Communication" title={t('languagesTitle')} />
        <RevealGroup className="grid gap-4 sm:grid-cols-2">
          {languages.map((language) => (
            <RevealItem key={language.id}>
              <StickerCard className="h-full p-6">
                <p className="font-display flex items-center gap-2 text-lg font-bold">
                  <GlobeIcon className="text-brand size-5" />
                  {t(`languageNames.${language.id}` as 'languageNames.thai')}
                </p>
                <dl className="mt-4 space-y-3">
                  {(['speaking', 'reading', 'writing'] as const).map((skill) => (
                    <div key={skill} className="flex items-center gap-3">
                      <dt className="text-muted w-24 shrink-0 text-sm">
                        {t(`langSkill.${skill}` as 'langSkill.speaking')}
                      </dt>
                      <dd className="flex flex-1 items-center gap-2">
                        <div
                          className="bg-line-soft h-2 flex-1 overflow-hidden rounded-full"
                          role="meter"
                          aria-valuenow={language[skill]}
                          aria-valuemin={1}
                          aria-valuemax={5}
                          aria-label={t(`langSkill.${skill}` as 'langSkill.speaking')}
                        >
                          <div
                            className="bg-brand h-full rounded-full"
                            style={{ width: `${(language[skill] / 5) * 100}%` }}
                          />
                        </div>
                        <span className="font-display text-muted w-20 shrink-0 text-end text-xs font-semibold">
                          {t(`levels.${language[skill]}` as 'levels.5')}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </StickerCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </>
  )
}
