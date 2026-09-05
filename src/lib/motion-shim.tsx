'use client'

import { createElement, type ReactNode } from 'react'

/**
 * A stand-in for `motion/react`, so this branch has no animation and no inline
 * styles without every component having to be rewritten.
 *
 * The eleven files that animate import `motion` from here instead. Each keeps
 * its markup exactly as it was — same tags, same children, same order — and the
 * props that only meant something to the animation library are dropped on the
 * way to the DOM. A page from 1996 does not move, and nothing here should have
 * to know that.
 *
 * `style` is dropped along with them, deliberately: a stylesheet can be turned
 * off, and an inline style cannot. That is the whole conceit of this branch.
 */
const DROP = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'custom',
  'layout',
  'layoutId',
  'layoutScroll',
  'layoutRoot',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'viewport',
  'drag',
  'dragConstraints',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'transformTemplate',
  'style',
])

type AnyProps = Record<string, unknown>

function strip(props: AnyProps): AnyProps {
  const out: AnyProps = {}
  for (const key of Object.keys(props)) {
    if (!DROP.has(key)) out[key] = props[key]
  }
  return out
}

/**
 * `motion.div`, `motion.p`, `motion.h1` … resolved on demand.
 *
 * A proxy rather than a fixed list: the set of tags in use is not something this
 * file should have to track, and a missing one would be a build error in a
 * component that has nothing to do with animation.
 */
export const motion: Record<string, (props: AnyProps) => ReactNode> = new Proxy(
  {},
  {
    get(cache: Record<string, (props: AnyProps) => ReactNode>, tag: string) {
      if (!cache[tag]) {
        const Component = (props: AnyProps) => createElement(tag, strip(props))
        Component.displayName = `plain.${tag}`
        cache[tag] = Component
      }
      return cache[tag]
    },
  },
)

/**
 * Nothing enters or leaves; children simply are.
 *
 * Both of these take whatever they are handed. Callers pass `initial`,
 * `transition` and the rest, and typing the props precisely would only mean
 * eleven components having to stop passing them — which is the rewrite this
 * shim exists to avoid.
 */
export function AnimatePresence({ children }: { children?: ReactNode } & AnyProps) {
  return <>{children}</>
}

export function MotionConfig({ children }: { children?: ReactNode } & AnyProps) {
  return <>{children}</>
}

/**
 * Always true.
 *
 * Every caller uses this to decide whether to skip an animation, so answering
 * "yes, reduce" takes the quiet path through code that was already written to
 * handle somebody who had asked for less movement.
 */
export function useReducedMotion() {
  return true
}
