'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
// The typewriter is kept, not deleted — it is the fallback if the scramble
// wears thin.
// import { Typewriter } from '@/components/motion/typewriter'
import { TextScramble } from '@/components/motion/text-scramble'
import { CircleScribble, StarGrid } from '@/components/ui/decor'
import { KnowledgeGraph, type GraphNode } from './knowledge-graph'
import {
  ArrowRightIcon,
  EyeIcon,
  MailIcon,
  SparkleIcon,
} from '@/components/icons'
import { Container } from '@/components/ui/section'
import { ResumeButton } from '@/components/content/resume-button'


/**
 * The entrance animation should play once per session, not every time the tree
 * remounts. Switching language re-mounts the hero, and replaying the fade made
 * the photo blink out for ~half a second on every toggle.
 */
let heroHasEntered = false

export function Hero({ roles, graph }: { roles: string[]; graph: GraphNode[] }) {
  const t = useTranslations('home')
  const tMeta = useTranslations('meta')
  const reduce = useReducedMotion()
  const [playIntro] = useState(() => !heroHasEntered)

  useEffect(() => {
    heroHasEntered = true
  }, [])

  // `false` tells Motion to mount at the target values with no transition.
  const from = (values: Record<string, number>) => (reduce || !playIntro ? false : values)

  // The text slides in but never fades: an element at `opacity: 0` is not
  // painted, and the intro paragraph is this page's largest paint — fading it in
  // after hydration put the home page's LCP at 936ms when first contentful paint
  // was 92ms. The buttons and the graph still fade; neither is ever the LCP.

  return (
    <section className="relative overflow-hidden">
      <StarGrid />

      <Container className="relative z-10 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <motion.p
              initial={from({ y: 12 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-muted flex items-center gap-2 text-lg font-semibold"
            >
              <SparkleIcon className="text-sun size-5" />
              {t('greeting')}
            </motion.p>

            <motion.h1
              initial={from({ y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              // Fluid below the `sm` breakpoint so the name holds one line. The
              // Thai name is the long one: it needs 419px at 48px, and a phone
              // column is 288 to 398px, so it broke across two lines at every
              // phone width and the scribble had to loop around both. 10vw is
              // measured to fit it from 280px up, with the fixed sizes taking
              // over at 640 where it fits at full size anyway.
              //
              // Fluid again from `lg`, where the layout splits into two columns
              // and the text loses half the width: at 1024 the column is 603px
              // and the name needs 628px at 72px, so it broke there too. It
              // reaches full size by about 1120, where there is room for it.
              className="relative mt-2 text-[clamp(1.75rem,10vw,3rem)] sm:text-6xl lg:text-[clamp(4rem,6.4vw,4.5rem)]"
            >
              <span className="relative inline-block">
                {tMeta('siteName')}
                <CircleScribble
                  className="absolute -inset-x-4 -inset-y-3 -z-10 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)] opacity-40"
                  color="var(--brand)"
                />
              </span>
            </motion.h1>

            <motion.div
              initial={from({ y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="font-display mt-4 text-2xl font-bold sm:text-3xl"
            >
              {/* <Typewriter phrases={roles} className="text-brand" /> */}
              <TextScramble phrases={roles} className="text-brand" />
            </motion.div>

            <motion.p
              initial={from({ y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="text-muted mt-6 max-w-xl text-lg leading-relaxed text-pretty"
            >
              {t('intro', { company: profile.company })}
            </motion.p>

            <motion.div
              initial={from({ opacity: 0, y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="mt-8 flex flex-wrap gap-3"
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

          {/* The work as a graph, where the photograph used to be.
              A picture of the author says who made these; this says what they
              are about, which is the question a portfolio is actually asked. */}
          <motion.div
            initial={from({ opacity: 0, scale: 0.95 })}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 90 }}
            className="relative mx-auto w-full max-w-[19rem] sm:max-w-[22rem] lg:max-w-[26rem]"
          >
            <KnowledgeGraph nodes={graph} />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
