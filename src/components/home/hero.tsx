'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '@/config/site'
import { ButtonLink } from '@/components/ui/button'
import { Typewriter } from '@/components/motion/typewriter'
import { CircleScribble, StarBurst, StarGrid } from '@/components/ui/decor'
import {
  ArrowRightIcon,
  CrownIcon,
  DownloadIcon,
  MailIcon,
  SparkleIcon,
  ThumbsUpIcon,
} from '@/components/icons'
import { Container } from '@/components/ui/section'

/** Floating sticker chips that echo the old portfolio's badges. */
function FloatingChip({
  children,
  className,
  delay = 0,
  tone,
  playIntro,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  tone: string
  /** False after the first mount, so a locale switch doesn't replay the pop-in. */
  playIntro: boolean
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
        className={`sticker-sm font-display flex items-center gap-2 px-3.5 py-2 text-sm font-bold ${tone} ${reduce ? '' : 'animate-float'}`}
        style={{ animationDelay: `${delay}s` }}
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
              className="relative mt-2 text-5xl sm:text-6xl lg:text-7xl"
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
              initial={from({ opacity: 0, y: 16 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="font-display mt-4 text-2xl font-bold sm:text-3xl"
            >
              <Typewriter phrases={roles} className="text-brand" />
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
              <ButtonLink href={profile.resume} variant="secondary" size="lg" external download>
                <DownloadIcon className="size-4" />
                {t('ctaResume')}
              </ButtonLink>
            </motion.div>
          </div>

          {/* Illustration panel — geometric avatar built from shapes, no photo needed. */}
          <motion.div
            initial={from({ opacity: 0, scale: 0.9 })}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 90 }}
            className="relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] lg:max-w-[20rem]"
          >
            <div className="sticker-lg bg-surface relative aspect-square overflow-hidden">
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

            <StarBurst className="animate-wobble absolute -top-4 -right-3 size-10" />
            <StarBurst className="animate-wobble absolute -bottom-2 -left-4 size-7" color="var(--mint)" />

            <FloatingChip
              className="absolute -top-5 -left-6 sm:-left-10"
              delay={0.5}
              tone="bg-sun-soft"
              playIntro={playIntro}
            >
              <CrownIcon className="text-sun size-4" />
              Software Engineer
            </FloatingChip>
            <FloatingChip
              className="absolute -right-4 -bottom-4 sm:-right-8"
              delay={0.75}
              tone="bg-mint-soft"
              playIntro={playIntro}
            >
              <ThumbsUpIcon className="text-mint size-4" />
              Good at Programming
            </FloatingChip>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
