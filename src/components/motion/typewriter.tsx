'use client'

import { useEffect, useState } from 'react'
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

export function MarqueeRow({
  items,
  className,
  reverse = false,
}: {
  items: string[]
  className?: string
  /** Kept in the signature so both call sites still compile; nothing scrolls. */
  duration?: number
  reverse?: boolean
}) {
  /**
   * A list, not a marquee.
   *
   * The scrolling row was two inline styles — a mask fading both ends and the
   * animation itself — and both are exactly what a page with no stylesheet
   * cannot have. The second copy of the items went with it: it existed only so
   * the loop could seam invisibly, and there is no loop.
   *
   * A real page from that era would have used `<marquee>`, which is the one
   * period-correct answer React will not let anybody write.
   */
  const list = reverse ? [...items].reverse() : items

  return (
    <ul className={className}>
      {list.map((item) => (
        <li key={item}>
          <Link href={`/topics/${tagSlug(item)}`}>
            <TechIcon name={item} />
            {item}
          </Link>
        </li>
      ))}
    </ul>
  )
}

