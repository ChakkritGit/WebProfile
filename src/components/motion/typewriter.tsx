'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/search'
import { cn } from '@/lib/utils'

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
  duration = 32,
  reverse = false,
}: {
  items: string[]
  className?: string
  duration?: number
  reverse?: boolean
}) {
  // Duplicated once so the -50% keyframe loops seamlessly.
  const doubled = [...items, ...items]
  return (
    <div
      // overflow-hidden is required for the loop; the vertical padding gives
      // each chip's 2px offset shadow room inside the clipping box.
      className={cn('group relative overflow-hidden py-1.5', className)}
      // Fade the ends so chips leaving the row read as intentional rather
      // than sliced by the container edge.
      style={{
        maskImage:
          'linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)',
      }}
    >
      <div
        className="flex w-max gap-3 will-change-transform group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {doubled.map((item, i) => (
          <Link
            key={`${item}-${i}`}
            href={`/topics/${tagSlug(item)}`}
            // The duplicate half is decorative; hide it from assistive tech.
            aria-hidden={i >= items.length}
            tabIndex={i >= items.length ? -1 : undefined}
            className="sticker-sm sticker-hover bg-surface font-display shrink-0 px-4 py-2 text-sm font-semibold no-underline"
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  )
}
