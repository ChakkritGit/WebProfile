import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import {
  education,
  experience,
  languages,
  profile,
  skillGroups,
  socials,
  yearsOfExperience,
} from '@/config/site'
import { listProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { Section, SectionHeading } from '@/components/ui/section'
import { TagLink } from '@/components/content/tag-link'
import { ContactForm } from '@/components/content/contact-form'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { MarqueeRow } from '@/components/motion/typewriter'
import { ProfileHero, type ProfileStat } from '@/components/about/profile-hero'
import { WORLD_GLYPHS_FONT } from '@/lib/world-glyphs'
import { WebringBadge } from '@/components/layout/webring-badge'
import { ButtonLink } from '@/components/ui/button'
import {
  BriefcaseIcon,
  CapIcon,
  ExternalLinkIcon,
  FacebookIcon,
  GitHubIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
} from '@/components/icons'
import { formatMonthYear } from '@/lib/utils'

/**
 * Everything about the person, on one page: what the home page used to open
 * with, the profile, and the contact page. `/contact` redirects to
 * `#contact` here.
 */

export const revalidate = 60

const ICONS = {
  github: GitHubIcon,
  email: MailIcon,
  phone: PhoneIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
} as const

const DIRECT = ['email', 'phone', 'github'] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return buildMetadata({
    title: t('title'),
    description: t('subtitle'),
    path: '/about',
    locale: locale as Locale,
  })
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const t = await getTranslations('about')
  const tHome = await getTranslations('home')
  const tSkills = await getTranslations('skills')
  const tContact = await getTranslations('contact')
  const tCommon = await getTranslations('common')

  const projects = await listProjects({ locale: locale as Locale })
  const allSkills = skillGroups.flatMap((group) => [...group.items])
  const stats: ProfileStat[] = [
    { key: 'experience', value: `${yearsOfExperience()}+` },
    { key: 'projects', value: `${Math.max(3, projects.length)}` },
    { key: 'stack', value: `${allSkills.length}` },
    { key: 'company', value: 'Thanes' },
  ]
  const elsewhere = socials.filter((s) => !DIRECT.includes(s.id as (typeof DIRECT)[number]))

  return (
    <>
      <link rel="stylesheet" href={WORLD_GLYPHS_FONT} precedence="default" />
      <ProfileHero roles={tHome.raw('roles') as string[]} stats={stats} />

      {/* ----------------------------- summary ----------------------------- */}
      <Section className="border-line border-b">
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <p className="label-mono text-brand-strong">{t('summaryTitle')}</p>
          <p className="text-ink-soft max-w-3xl text-lg leading-[1.85] sm:text-xl">
            {t('summaryBody', { years: yearsOfExperience(), company: profile.company })}
          </p>
        </div>
      </Section>

      {/* ------------------------------ skills ----------------------------- */}
      <Section className="border-line border-b">
        <SectionHeading eyebrow="01 — Stack" title={tHome('skillsTitle')} description={tHome('skillsSubtitle')} />
        <Reveal className="space-y-3">
          <MarqueeRow items={allSkills} duration={46} />
          <MarqueeRow items={[...allSkills].reverse()} duration={54} reverse />
        </Reveal>
        <RevealGroup className="border-line mt-8 grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <RevealItem key={group.id} className="border-line border-r border-b p-6">
              <p className="label-mono text-brand-strong">{tSkills(group.id)}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item}>
                    <TagLink tag={item} />
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ------------------------ experience · study ----------------------- */}
      <Section className="border-line border-b">
        <SectionHeading eyebrow="02 — Career" title={t('experienceTitle')} />
        <ol className="border-line border-t">
          {experience.map((job) => (
            <li key={job.id} className="border-line grid gap-4 border-b py-7 lg:grid-cols-[14rem_1fr]">
              <p className="text-muted font-mono text-xs uppercase">
                {formatMonthYear(job.start, locale)} — {job.end ? formatMonthYear(job.end, locale) : tCommon('present')}
              </p>
              <div>
                <h3 className="flex items-center gap-2 text-3xl">
                  <BriefcaseIcon aria-hidden className="text-brand-strong size-5 shrink-0" strokeWidth={1.75} />
                  {t(`jobs.${job.id}.role` as 'jobs.thanes.role')}
                </h3>
                <p className="text-brand-strong mt-1 font-mono text-sm">{job.company}</p>
                <p className="text-ink-soft mt-3 max-w-3xl leading-relaxed">
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
            </li>
          ))}
        </ol>

        <h2 className="mt-14 mb-6 text-3xl sm:text-4xl">{t('educationTitle')}</h2>
        <ol className="border-line border-t">
          {education.map((school) => (
            <li key={school.id} className="border-line grid gap-4 border-b py-7 lg:grid-cols-[14rem_1fr]">
              <p className="text-muted font-mono text-xs uppercase">
                {formatMonthYear(school.start, locale)} — {formatMonthYear(school.end, locale)}
              </p>
              <div>
                <h3 className="flex items-center gap-2 text-2xl">
                  <CapIcon aria-hidden className="text-brand-strong size-5 shrink-0" strokeWidth={1.75} />
                  {t(`schools.${school.id}.degree` as 'schools.nrru.degree')}
                </h3>
                <p className="text-brand-strong mt-1 font-mono text-sm">
                  {t(`schools.${school.id}.school` as 'schools.nrru.school')} · {t('gpa', { gpa: school.gpa })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ----------------------------- languages --------------------------- */}
      <Section className="border-line border-b">
        <SectionHeading eyebrow="03 — Languages" title={t('languagesTitle')} />
        <div className="border-line grid border-t border-l sm:grid-cols-2">
          {languages.map((language) => (
            <div key={language.id} className="border-line border-r border-b p-6">
              <p className="text-2xl">{t(`languageNames.${language.id}` as 'languageNames.thai')}</p>
              <dl className="mt-4 space-y-3">
                {(['speaking', 'reading', 'writing'] as const).map((skill) => (
                  <div key={skill} className="flex items-center gap-3">
                    <dt className="text-muted w-24 shrink-0 text-sm">
                      {t(`langSkill.${skill}` as 'langSkill.speaking')}
                    </dt>
                    <dd className="flex flex-1 items-center gap-3">
                      <div
                        className="flex flex-1 gap-1"
                        role="meter"
                        aria-valuenow={language[skill]}
                        aria-valuemin={1}
                        aria-valuemax={5}
                        aria-label={t(`langSkill.${skill}` as 'langSkill.speaking')}
                      >
                        {[1, 2, 3, 4, 5].map((step) => (
                          <span
                            key={step}
                            className={step <= language[skill] ? 'bg-brand h-2 flex-1' : 'bg-line h-2 flex-1'}
                          />
                        ))}
                      </div>
                      <span className="text-muted w-20 shrink-0 text-end font-mono text-[0.7rem] uppercase">
                        {t(`levels.${language[skill]}` as 'levels.5')}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------ contact ---------------------------- */}
      <Section id="contact" className="border-line scroll-mt-16 border-b">
        <SectionHeading eyebrow="04 — Contact" title={tContact('title')} description={tContact('subtitle')} />
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-8">
            <div>
              <p className="label-mono text-muted mb-3">{tContact('directTitle')}</p>
              <ul className="border-line border-t">
                {DIRECT.map((id) => {
                  const link = socials.find((s) => s.id === id)
                  if (!link) return null
                  const Icon = ICONS[id]
                  const external = link.href.startsWith('http')
                  return (
                    <li key={id} className="border-line border-b">
                      <a
                        href={link.href}
                        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                        className="group hover:bg-surface flex items-center gap-4 px-2 py-4 no-underline transition-colors"
                      >
                        <Icon aria-hidden className="text-brand-strong size-5 shrink-0" />
                        <span className="label-mono text-muted w-20 shrink-0">{link.label}</span>
                        <span className="group-hover:text-brand-strong min-w-0 truncate">{link.handle}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            <dl className="border-line grid border sm:grid-cols-2">
              <div className="border-line border-b p-5 sm:border-r sm:border-b-0">
                <dt className="label-mono text-muted flex items-center gap-2">
                  <MapPinIcon aria-hidden className="size-3.5" />
                  {tContact('locationTitle')}
                </dt>
                <dd className="mt-2 text-sm">{profile.location}</dd>
              </div>
              <div className="p-5">
                <dt className="label-mono text-muted">{tContact('availabilityTitle')}</dt>
                <dd className="mt-2 text-sm leading-relaxed">{tContact('availabilityBody')}</dd>
              </div>
            </dl>

            <div>
              <p className="label-mono text-muted mb-3">{tContact('socialTitle')}</p>
              <ul className="flex flex-wrap gap-2">
                {elsewhere.map((link) => {
                  const Icon = ICONS[link.id]
                  return (
                    <li key={link.id}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${link.label}: ${link.handle}`}
                        className="border-line hover:border-line-strong hover:text-brand-strong flex items-center gap-2 border px-4 py-2 text-sm no-underline transition-colors"
                      >
                        <Icon className="size-4" />
                        {link.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <ContactForm email={profile.email} />
        </div>
      </Section>

      {/* ------------------------------ webring ---------------------------- */}
      <Section>
        <div className="border-line flex flex-col items-start gap-6 border p-7 sm:flex-row sm:items-center sm:p-10">
          <div className="border-line bg-surface grid size-20 shrink-0 place-items-center border">
            <WebringBadge size={44} />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl">{tHome('webringTitle')}</h2>
            <p className="text-ink-soft mt-2 max-w-xl leading-relaxed">{tHome('webringBody')}</p>
          </div>
          <ButtonLink href="https://webring.wonderful.software" variant="outline" external>
            {tHome('webringCta')}
            <ExternalLinkIcon className="size-4" />
          </ButtonLink>
        </div>
      </Section>
    </>
  )
}
