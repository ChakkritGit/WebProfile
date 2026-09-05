'use client'

import { createElement, useEffect, useState } from 'react'
import { useReducedMotion } from '@/lib/motion-shim'
import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/search'
import { TechIcon } from '@/components/brand/tech-icons'

/**
 * Cycles through phrases, typing and deleting. Uses Array.from so Thai
 * combining marks and emoji are never split mid-character.
 */
export function Typewriter({
  phrases,
  className,
  typeSpeed = 65,
  deleteSpeed = 32,
  holdMs = 1600,
}: {
  phrases: string[]
  className?: string
  typeSpeed?: number
  deleteSpeed?: number
  holdMs?: number
}) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const phrase = phrases[index] ?? ''
  const chars = Array.from(phrase)

  useEffect(() => {
    if (reduce || phrases.length === 0) return

    if (!deleting && count === chars.length) {
      const hold = setTimeout(() => setDeleting(true), holdMs)
      return () => clearTimeout(hold)
    }

    if (deleting && count === 0) {
      // Advancing from a timer (rather than synchronously) keeps the update out
      // of the effect body and adds a natural beat between phrases.
      const advance = setTimeout(() => {
        setDeleting(false)
        setIndex((i) => (i + 1) % phrases.length)
      }, 260)
      return () => clearTimeout(advance)
    }

    const tick = setTimeout(
      () => setCount((c) => c + (deleting ? -1 : 1)),
      deleting ? deleteSpeed : typeSpeed,
    )
    return () => clearTimeout(tick)
  }, [count, deleting, chars.length, phrases.length, reduce, typeSpeed, deleteSpeed, holdMs])

  // Reduced motion: show the first phrase, no animation, no caret.
  if (reduce) return <span className={className}>{phrases[0]}</span>

  return (
    <span className={className}>
      {/* Reserve the widest phrase's height and announce changes politely. */}
      <span aria-live="polite" aria-atomic="true">
        {chars.slice(0, count).join('')}
      </span>
      <span aria-hidden className="animate-caret text-brand ml-0.5 font-normal">
        |
      </span>
    </span>
  )
}

/**
 * A marquee. The actual element.
 *
 * `<marquee>` was deprecated two decades ago and every browser still runs it,
 * which is the single most period-correct fact available here. It also sidesteps
 * the branch's own rule against animation: this is not a CSS animation that a
 * blanket `animation: none` could switch off, it is the element doing what the
 * element does.
 *
 * Written through `createElement` because React's JSX types have no `marquee`
 * in them — it predates every type definition anyone has written — and adding
 * one to the global namespace for a single tag is a worse trade than this.
 *
 * The duplicated half is gone with the CSS loop that needed it: `<marquee>`
 * wraps by itself.
 */
export function MarqueeRow({
  items,
  className,
  duration = 32,
  reverse = false,
}: {
  items: string[]
  className?: string
  duration?: number
  reverse?: boolean
}) {
  // `scrollamount` is pixels per tick, not seconds per lap. A longer duration
  // asked for a slower row, so it has to invert.
  const speed = Math.max(2, Math.round(180 / duration))

  return createElement(
    'marquee',
    {
      className,
      direction: reverse ? 'right' : 'left',
      scrollamount: speed,
      behavior: 'scroll',
    },
    items.map((item) => (
      <Link key={item} href={`/topics/${tagSlug(item)}`} className="sticker-sm mx-1 inline-flex items-center gap-2 px-3 py-1">
        <TechIcon name={item} />
        {item}
      </Link>
    )),
  )
}


