'use client'

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-triggered entrance.
 *
 * The element is always a motion element, on both sides of hydration. Swapping
 * it for a plain `<div>` when the visitor prefers reduced motion left every
 * revealed card permanently invisible: the server, which cannot know the
 * preference, renders `initial` as an inline `opacity: 0`, and React does not
 * patch attribute mismatches — so the style stayed and nothing ever animated it
 * away. Reduced motion now means a zero-length transition, and the CSS rule
 * under `prefers-reduced-motion` in `globals.css` un-hides `[data-reveal]`
 * before any of this loads.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  once = true,
  firstPaint = false,
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  once?: boolean
  /**
   * Enter in CSS, at the first paint, instead of waiting to be scrolled to.
   *
   * For anything already on screen when the page arrives. A scroll reveal cannot
   * start until React has hydrated — two and a half seconds on a throttled phone
   * — so the top of the page sat half-faded until 3.2s, which is exactly what
   * Speed Index measures. The stylesheet has no such wait: same movement, run
   * while the page is arriving rather than after it.
   */
  firstPaint?: boolean
}) {
  const reduce = useReducedMotion()
  const { x, y } = offsets[direction]

  if (firstPaint) {
    return (
      <div className={cn('hero-in', className)} style={delay ? { animationDelay: `${delay}s` } : undefined}>
        {children}
      </div>
    )
  }

  const animated = (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )

  // A sideways entrance widens the page while it waits its turn: a full-width card
  // parked 24px to the right pushed the document 8px past a 390px viewport, and
  // anything below the fold stayed there until it was scrolled to. Clipping the
  // wrapper keeps the offset off the layout; the clip margin leaves room for the
  // sticker shadow so nothing visible is cut.
  if (x === 0) return animated
  return <div style={{ overflowX: 'clip', overflowClipMargin: '16px' }}>{animated}</div>
}

/**
 * Layout container for a staggered list.
 *
 * Deliberately NOT a motion element driving child variants: a parent that has
 * already finished animating never propagates its state to children mounted
 * later, which left filtered-then-restored cards stuck at opacity 0. Each item
 * observes itself instead, so any item — whenever it mounts — animates in on
 * its own. The stagger comes from an index-derived delay injected here.
 */
export function RevealGroup({
  children,
  className,
  firstPaint = false,
}: {
  children: ReactNode
  className?: string
  /** Passed to every item: the group is on screen at first paint. */
  firstPaint?: boolean
}) {
  let index = 0
  const staggered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const element = child as ReactElement<{ index?: number; firstPaint?: boolean }>
    const extra = firstPaint ? { firstPaint: true } : {}
    if (element.props.index !== undefined) return cloneElement(element, extra)
    return cloneElement(element, { index: index++, ...extra })
  })

  return <div className={className}>{staggered}</div>
}

export function RevealItem({
  children,
  className,
  index = 0,
  firstPaint = false,
}: {
  children: ReactNode
  className?: string
  /** Position in the group; drives the stagger delay. Injected by RevealGroup. */
  index?: number
  /**
   * Enter in CSS for items that are on screen when the page arrives.
   *
   * A scroll reveal is invisible until React has hydrated and the observer has
   * fired, which an above-the-fold card cannot afford: measured on `/en/blog`,
   * the listing's largest paint was 984ms with the entrance and 364ms without it.
   * The same movement from the stylesheet starts at the first paint instead, and
   * keeps the stagger.
   */
  firstPaint?: boolean
}) {
  const reduce = useReducedMotion()

  if (firstPaint) {
    return (
      <div
        className={cn('hero-in', className)}
        style={{ animationDelay: `${Math.min(index, 8) * 0.07}s` }}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: reduce ? 0 : 0.5,
        // Cap the cascade so a long list never leaves the last card waiting.
        delay: reduce ? 0 : Math.min(index, 8) * 0.07,
        ease: [0.34, 1.4, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
