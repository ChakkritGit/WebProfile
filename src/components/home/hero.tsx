'use client'

import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
// The typewriter is kept, not deleted — it is the fallback if the scramble
// wears thin.
// import { Typewriter } from '@/components/motion/typewriter'
import { TextScramble } from '@/components/motion/text-scramble'
import { StarGrid } from '@/components/ui/decor'
import { ArrowRightIcon, EyeIcon, MailIcon } from '@/components/icons'
import { Container } from '@/components/ui/section'
import { ResumeButton } from '@/components/content/resume-button'

/**
 * The opening, without a photograph.
 *
 * The old hero split the fold in two and gave half of it to a picture, which
 * left the name fighting for a column barely wider than the name itself — hence
 * the three separate fluid type ramps it needed to stay on one line. Given the
 * whole width it needs none of them: one clamp, and it holds from a phone to a
 * desktop.
 *
 * The figures moved up into the fold with it. They were four cards in a row of
 * their own further down the page, which is a lot of ceremony for four numbers;
 * as a rule-separated strip they finish the opening statement instead of
 * starting a new one.
 *
 * Every entrance is unchanged — the stagger, the scramble on the role, the
 * reduced-motion path. Only what arrives is different.
 */
export function Hero({
  roles,
  stats,
}: {
  roles: string[]
  stats: { key: string; value: string; label: string }[]
}) {
  const t = useTranslations('home')
  const tMeta = useTranslations('meta')
  const reduce = useReducedMotion()
  const from = (value: Record<string, number>) => (reduce ? false : value)

  return (
    <section className="relative overflow-hidden">
      <StarGrid />

      <Container className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-4xl">
          <motion.p
            initial={from({ opacity: 0, y: 12 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-muted text-sm font-medium tracking-[0.14em] uppercase"
          >
            {t('greeting')}
          </motion.p>

          <motion.h1
            initial={from({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-4 text-[clamp(2.25rem,7vw,4.75rem)] leading-[1.08]"
          >
            {tMeta('siteName')}
          </motion.h1>

          <motion.div
            initial={from({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-3 text-xl font-semibold sm:text-2xl"
          >
            {/* <Typewriter phrases={roles} className="text-brand" /> */}
            <TextScramble phrases={roles} className="text-brand" />
          </motion.div>

          <motion.p
            initial={from({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="text-muted mt-7 max-w-2xl text-lg leading-relaxed text-pretty"
          >
            {t('intro', { company: profile.company })}
          </motion.p>

          <motion.div
            initial={from({ opacity: 0, y: 16 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <ButtonLink href="/projects" size="lg">
              {t('ctaProjects')}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              <MailIcon className="size-4" />
              {t('ctaContact')}
            </ButtonLink>
            <ResumeButton variant="secondary" size="lg">
              <EyeIcon className="size-4" />
              {t('ctaResume')}
            </ResumeButton>
          </motion.div>
        </div>

        {/* Four figures on one rule. Divided by lines rather than boxed, because
            a box says "these are four things" and a rule says "these are four
            parts of one thing", which is what they are. */}
        <motion.dl
          initial={from({ opacity: 0, y: 16 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="border-line mt-16 grid grid-cols-2 gap-y-8 border-t pt-8 sm:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <div key={stat.key} className={i > 0 ? 'sm:border-line sm:border-l sm:pl-6' : 'sm:pr-6'}>
              <dt className="text-muted order-2 mt-1 text-sm">{stat.label}</dt>
              <dd className="text-3xl leading-none font-bold sm:text-4xl">{stat.value}</dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  )
}
