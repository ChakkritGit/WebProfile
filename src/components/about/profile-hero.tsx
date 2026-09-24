'use client'

import { useTranslations } from 'next-intl'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/section'
import { TextScramble } from '@/components/motion/text-scramble'
import { ResumeButton } from '@/components/content/resume-button'
import { EyeIcon, MailIcon } from '@/components/icons'

export interface ProfileStat {
  key: 'experience' | 'projects' | 'stack' | 'company'
  value: string
}

/**
 * The top of `/about`: who, what, and the few numbers — what the home page used
 * to open with before it became the articles' page.
 *
 * The entrance is the stylesheet's `hero-in`, not Motion: it starts at the
 * first paint rather than after hydration, which is what cost Speed Index
 * when this screen used to wait for JavaScript to arrive.
 */
export function ProfileHero({ roles, stats }: { roles: string[]; stats: ProfileStat[] }) {
  const t = useTranslations('home')
  const tMeta = useTranslations('meta')

  return (
    <section className="border-line relative overflow-hidden border-b">
      <div aria-hidden className="star-grid pointer-events-none absolute inset-0" />
      <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div className="hero-in">
          <p className="label-mono text-brand-strong">{t('greeting')}</p>
          <h1 className="mt-4 text-[clamp(2.75rem,11vw,5.5rem)] uppercase">{tMeta('siteName')}</h1>
          <div className="text-brand-strong mt-3 font-mono text-lg sm:text-xl">
            <span aria-hidden>&gt; </span>
            <TextScramble phrases={roles} world />
          </div>
          <p className="text-ink-soft mt-6 max-w-xl text-lg leading-relaxed">
            {t('intro', { company: profile.company })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#contact" size="lg">
              <MailIcon className="size-4" />
              {t('ctaContact')}
            </ButtonLink>
            <ResumeButton variant="outline" size="lg">
              <EyeIcon className="size-4" />
              {t('ctaResume')}
            </ResumeButton>
          </div>
        </div>

        <dl className="hero-in border-line bg-surface grid grid-cols-2 border [animation-delay:0.12s]">
          {stats.map((stat, i) => (
            <div
              key={stat.key}
              className={[
                'border-line p-5',
                i % 2 === 0 ? 'border-r' : '',
                i < 2 ? 'border-b' : '',
              ].join(' ')}
            >
              <dt className="label-mono text-muted">{t(`stats.${stat.key}`)}</dt>
              <dd
                className={
                  stat.key === 'company'
                    ? 'font-display mt-2 text-2xl uppercase [font-stretch:72%]'
                    : 'text-brand-strong mt-2 font-mono text-4xl'
                }
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
