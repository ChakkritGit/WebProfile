'use client'

import { createElement, useSyncExternalStore, type ReactNode } from 'react'

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
 * The real answer, from the real media query.
 *
 * This returned `true` for everybody at first, on the reasoning that a page from
 * 1998 does not move. It moved too much: the callers that ask this are not only
 * the ones running CSS animations — which are off regardless — but the two that
 * are pure JavaScript text effects, and `TextScramble` reads it and returns the
 * phrase standing still. Answering "reduce" for everyone silently switched the
 * scramble off for people who had never asked for that.
 *
 * A scrambling headline is period-correct anyway. Text effects written in
 * JavaScript are exactly what pages of that era did, and the ones that did not
 * want them said so — which is what this now reports.
 */
const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(notify: () => void) {
  const media = matchMedia(QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    // On the server nobody has expressed a preference; assume none, which is
    // what the browser will report for most people a moment later.
    () => false,
  )
}
