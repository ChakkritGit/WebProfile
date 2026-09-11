'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
// The typewriter is kept, not deleted — it is the fallback if the scramble
// wears thin.
// import { Typewriter } from '@/components/motion/typewriter'
import { TextScramble } from '@/components/motion/text-scramble'
import { CircleScribble, StarGrid } from '@/components/ui/decor'
import type { GraphNode } from './knowledge-graph'

/**
 * The graph is fetched only where it is shown.
 *
 * It is the largest thing the home page owns and phones do not get it at all, so
 * shipping it to them was 60KB of JavaScript to draw nothing. `ssr: false` keeps
 * the server's markup and the first client render identical — both empty — and
 * the media query decides whether the chunk is ever asked for.
 */
const KnowledgeGraph = dynamic(
  () => import('./knowledge-graph').then((m) => m.KnowledgeGraph),
  { ssr: false },
)
import {
  ArrowRightIcon,
  EyeIcon,
  MailIcon,
  SparkleIcon,
} from '@/components/icons'
import { Container } from '@/components/ui/section'
import { cn } from '@/lib/utils'
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
  // Matches the `sm` breakpoint the wrapper below hides the graph at.
  const [wide, setWide] = useState(false)

  useEffect(() => {
    heroHasEntered = true
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const sync = () => setWide(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  // `false` tells Motion to mount at the target values with no transition.
  const from = (values: Record<string, number>) => (reduce || !playIntro ? false : values)

  /** The entrance plays once a session, and not at all for a reader who asked
      for no motion — the delays stay on the elements either way, harmless
      without an animation to delay. */
  const entering = playIntro && !reduce

  /**
   * The first screen does not animate at all.
   *
   * It used to fade in, which cost the largest paint: an element at `opacity: 0`
   * is not painted, and the home page's LCP was 936ms against a first paint of
   * 92ms. Dropping the fade fixed that, and left a slide — which then kept the
   * whole column moving for ~900ms after hydration, so on a throttled phone the
   * page was still visibly settling at 3.5s. Measured frame by frame: the text
   * and buttons were in their final place at 2.8s and still 16px low.
   *
   * So nothing here has an entrance. The graph, which is the other column and is
   * not rendered on phones at all, keeps its.
   */

  return (
    <section className="relative overflow-hidden">
      <StarGrid axes />

      <Container className="relative z-10 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p
              style={{ animationDelay: '0s' }}
              className={cn(
                'font-display text-muted flex items-center gap-2 text-lg font-semibold',
                entering && 'hero-in',
              )}
            >
              <SparkleIcon className="text-sun size-5" />
              {t('greeting')}
            </p>

            <h1
              style={{ animationDelay: '0.08s' }}
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
              className={cn(
                'relative mt-2 text-[clamp(1.75rem,10vw,3rem)] sm:text-6xl lg:text-[clamp(4rem,6.4vw,4.5rem)]',
                entering && 'hero-in',
              )}
            >
              <span className="relative inline-block">
                {tMeta('siteName')}
                <CircleScribble
                  className="absolute -inset-x-4 -inset-y-3 -z-10 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)] opacity-40"
                  color="var(--brand)"
                />
              </span>
            </h1>

            <div
              style={{ animationDelay: '0.16s' }}
              className={cn('font-display mt-4 text-2xl font-bold sm:text-3xl', entering && 'hero-in')}
            >
              {/* <Typewriter phrases={roles} className="text-brand-strong" /> */}
              <TextScramble phrases={roles} className="text-brand-strong" />
            </div>

            <p
              style={{ animationDelay: '0.24s' }}
              className={cn(
                'text-muted mt-6 max-w-xl text-lg leading-relaxed text-pretty',
                entering && 'hero-in',
              )}
            >
              {t('intro', { company: profile.company })}
            </p>

            <div
              style={{ animationDelay: '0.32s' }}
              className={cn('mt-8 flex flex-wrap gap-3', entering && 'hero-in')}
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
            </div>
          </div>

          {/* The work as a graph, where the photograph used to be.
              A picture of the author says who made these; this says what they
              are about, which is the question a portfolio is actually asked. */}
          <motion.div
            initial={from({ opacity: 0, scale: 0.95 })}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 90 }}
            // Not on phones. It is a square that fills the screen, it takes the
            // touch it is given (dragging turns it, so the page cannot be
            // scrolled from on top of it), and the hero reads perfectly well
            // without it.
            className="relative mx-auto hidden w-full max-w-[19rem] sm:block sm:max-w-[22rem] lg:max-w-[26rem]"
          >
            {wide && <KnowledgeGraph nodes={graph} />}
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
