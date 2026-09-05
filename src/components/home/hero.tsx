'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
// The typewriter is kept, not deleted — it is the fallback if the scramble
// wears thin.
// import { Typewriter } from '@/components/motion/typewriter'
import { TextScramble } from '@/components/motion/text-scramble'
import { StarGrid } from '@/components/ui/decor'
import {
  ArrowRightIcon,
  CrownIcon,
  EyeIcon,
  MailIcon,
  SparkleIcon,
  ThumbsUpIcon,
} from '@/components/icons'
import { Container } from '@/components/ui/section'
import { ResumeButton } from '@/components/content/resume-button'

/**
 * The badges stuck to the photograph, echoing the old portfolio's.
 *
 * They do not bob any more. A sticker on a sheet of paper is stuck to it; the
 * float was left over from when these hovered beside a framed picture rather
 * than sitting on one.
 */
function StickerChip({
  children,
  className,
  delay = 0,
  tone,
  playIntro,
  peel = false,
}: {
  children: React.ReactNode
  className?: string
  /** How far into the entrance this one arrives. */
  delay?: number
  tone: string
  /** False after the first mount, so a locale switch doesn't replay the pop-in. */
  playIntro: boolean
  /** Coming away from the paper at its right edge, with a shadow under the lift. */
  peel?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce || !playIntro ? false : { opacity: 0, scale: 0.6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      className={className}
    >
      <div
        className={`sticker-sm font-display flex items-center gap-2 px-3.5 py-2 text-sm font-bold ${tone} ${peel ? 'sticker-peel' : ''}`}
      >
        {children}
      </div>
    </motion.div>
  )
}

/**
 * The entrance animation should play once per session, not every time the tree
 * remounts. Switching language re-mounts the hero, and replaying the fade made
 * the photo blink out for ~half a second on every toggle.
 */
let heroHasEntered = false

export function Hero({ roles }: { roles: string[] }) {
  const t = useTranslations('home')
  const tMeta = useTranslations('meta')
  const reduce = useReducedMotion()
  const [playIntro] = useState(() => !heroHasEntered)

  useEffect(() => {
    heroHasEntered = true
  }, [])

  // `false` tells Motion to mount at the target values with no transition.
  const from = (values: Record<string, number>) => (reduce || !playIntro ? false : values)

  return (
    <section className="relative overflow-hidden">
      <StarGrid />

      <Container className="relative z-10 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <motion.p
              initial={from({ opacity: 0, y: 12 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-muted flex items-center gap-2 text-lg font-semibold"
            >
              <SparkleIcon className="text-sun size-5" />
              {t('greeting')}
            </motion.p>

            <motion.h1
              initial={from({ opacity: 0, y: 16 })}
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
              {/* The circled name went with the pen that drew it. A name set
                  large enough does not need to be pointed at. */}
              {tMeta('siteName')}
            </motion.h1>

            <motion.div
              initial={from({ opacity: 0, y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="font-display mt-4 text-2xl font-bold sm:text-3xl"
            >
              {/* <Typewriter phrases={roles} className="text-brand" /> */}
              <TextScramble phrases={roles} className="text-brand" />
            </motion.div>

            <motion.p
              initial={from({ opacity: 0, y: 16 })}
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

          {/* The photo, framed and left alone. The entrance is untouched — it is
              the arrival that carries the page, not the paper it arrives on. */}
          <motion.div
            initial={from({ opacity: 0, scale: 0.9 })}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 90 }}
            className="relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] lg:max-w-[20rem]"
          >
            <div className="border-line bg-surface relative aspect-square overflow-hidden rounded-sm border">
              <Image
                src={profile.avatar}
                alt={tMeta('siteName')}
                width={860}
                height={860}
                priority
                sizes="(max-width: 640px) 15rem, (max-width: 1024px) 18rem, 20rem"
                className="size-full object-cover"
              />
            </div>

            <StickerChip
              className="absolute -top-5 -left-6 sm:-left-10"
              delay={0.5}
              tone="bg-sun-soft"
              playIntro={playIntro}
            >
              <CrownIcon className="text-sun size-4" />
              Software Engineer
            </StickerChip>
            <StickerChip
              className="absolute -right-4 -bottom-4 sm:-right-8"
              delay={0.75}
              tone="bg-mint-soft"
              playIntro={playIntro}
              peel
            >
              <ThumbsUpIcon className="text-mint size-4" />
              Good at Programming
            </StickerChip>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
