'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/** What a character churns through before it settles. */
const NOISE = Array.from('!<>-_\\/[]{}=+*^?#%$&@01')

/** Frames per second the churn is stepped at. */
const FPS = 24

type Slot = {
  from: string
  to: string
  /** Frame this slot starts churning, and the one it settles on. */
  start: number
  end: number
  /** The step the character in `char` was drawn for, so it is only re-drawn
   *  when that step advances rather than on every frame. */
  step: number
  char: string
}

/**
 * Cycles through phrases, scrambling from one to the next — and scrambles the
 * first one in on arrival, out of noise, rather than showing it already settled.
 *
 * Each character gets its own window: it holds the outgoing letter until its
 * start frame, churns through noise until its end frame, then settles on the
 * incoming one. The windows are staggered and of different lengths, so the
 * phrase resolves raggedly from no particular direction rather than sweeping
 * left to right — a uniform stagger reads as a wipe, not a scramble.
 *
 * `Array.from` throughout, so Thai combining marks and emoji are never split
 * mid-character.
 */
export function TextScramble({
  phrases,
  className,
  holdMs = 2200,
}: {
  phrases: string[]
  className?: string
  /** How long a settled phrase is left alone before the next one starts. */
  holdMs?: number
}) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  // The settled first phrase, matching what the server sent. The scramble takes
  // over on the next frame; generating noise during render would be a different
  // string on the client than in the markup, which is a hydration error.
  const [text, setText] = useState(phrases[0] ?? '')
  const [revealed, setRevealed] = useState(false)
  const frame = useRef(0)
  const raf = useRef(0)

  useEffect(() => {
    if (reduce || phrases.length === 0) return

    let cancelled = false

    const run = (from: string, to: string, done: () => void) => {
      const a = Array.from(from)
      const b = Array.from(to)
      const length = Math.max(a.length, b.length)
      const slots: Slot[] = Array.from({ length }, (_, i) => {
        const start = Math.floor(Math.random() * 14)
        return {
          from: a[i] ?? '',
          to: b[i] ?? '',
          start,
          end: start + 6 + Math.floor(Math.random() * 14),
          step: -1,
          char: '',
        }
      })

      frame.current = 0
      let last = 0

      const step = (now: number) => {
        if (cancelled) return
        if (now - last < 1000 / FPS) {
          raf.current = requestAnimationFrame(step)
          return
        }
        last = now

        let settled = 0
        const out = slots
          .map((slot) => {
            if (frame.current >= slot.end) {
              settled += 1
              return slot.to
            }
            if (frame.current < slot.start) return slot.from
            // A fresh character every other frame, not every one: churning at the
            // full frame rate is a blur rather than something being read. Drawn
            // rather than derived — the first version hashed the frame against
            // the slot's own timings, which meant two runs that happened to draw
            // the same start and end played back the very same characters.
            const step = Math.floor((frame.current - slot.start) / 2)
            if (step !== slot.step) {
              slot.step = step
              slot.char = NOISE[Math.floor(Math.random() * NOISE.length)]
            }
            return slot.char
          })
          .join('')

        setText(out)
        frame.current += 1

        if (settled === slots.length) done()
        else raf.current = requestAnimationFrame(step)
      }

      raf.current = requestAnimationFrame(step)
    }

    // The first phrase is scrambled in as well, from noise, with no wait — the
    // line should be resolving as the page arrives rather than sitting there
    // already settled for two seconds.
    if (!revealed) {
      const target = phrases[0] ?? ''
      const noise = Array.from(target, () => NOISE[Math.floor(Math.random() * NOISE.length)]).join('')
      run(noise, target, () => setRevealed(true))
      return () => {
        cancelled = true
        cancelAnimationFrame(raf.current)
      }
    }

    if (phrases.length < 2) return

    const next = (index + 1) % phrases.length
    const hold = setTimeout(() => {
      run(phrases[index] ?? '', phrases[next] ?? '', () => setIndex(next))
    }, holdMs)

    return () => {
      cancelled = true
      clearTimeout(hold)
      cancelAnimationFrame(raf.current)
    }
  }, [index, revealed, phrases, reduce, holdMs])

  // Reduced motion: just say it.
  if (reduce) return <span className={className}>{phrases[0]}</span>

  return (
    <span className={className}>
      {/* The churn is noise, not words, so it is kept away from assistive tech;
          the settled phrase is announced on its own. */}
      <span aria-hidden>{text}</span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {phrases[index]}
      </span>
    </span>
  )
}
