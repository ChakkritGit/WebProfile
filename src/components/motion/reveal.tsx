'use client'

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { motion, useReducedMotion } from '@/lib/motion-shim'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-triggered entrance. Motion is dropped entirely (not just shortened)
 * when the visitor prefers reduced motion, so content appears immediately.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  once = true,
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  once?: boolean
}) {
  const reduce = useReducedMotion()
  const { x, y } = offsets[direction]

  if (reduce) return <div className={className}>{children}</div>

  const animated = (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
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
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  let index = 0
  const staggered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const element = child as ReactElement<{ index?: number }>
    if (element.props.index !== undefined) return element
    return cloneElement(element, { index: index++ })
  })

  return <div className={className}>{staggered}</div>
}

export function RevealItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode
  className?: string
  /** Position in the group; drives the stagger delay. Injected by RevealGroup. */
  index?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: 0.5,
        // Cap the cascade so a long list never leaves the last card waiting.
        delay: Math.min(index, 8) * 0.07,
        ease: [0.34, 1.4, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
