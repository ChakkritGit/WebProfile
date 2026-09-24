'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { WORLD_GLYPHS } from '@/lib/world-glyphs'

/** What a character churns through before it settles. */
const NOISE = Array.from('!<>-_\\/[]{}=+*^?#%$&@01')

/**
 * The button's churn reaches further: Egyptian hieroglyphs, cuneiform, runes,
 * Tifinagh, Ethiopic, Armenian, Greek, Cyrillic, katakana and Braille. Nothing
 * right-to-left — a Hebrew or Arabic letter would reorder the string around it
 * mid-word. The faces the rarer scripts need are cut to exactly these
 * characters and declared in globals.css.
 */
const WORLD = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(WORLD_GLYPHS)].map((g) => g.segment)

/**
 * Split into what a reader sees as characters. `Array.from` splits by code
 * point, which tears a Thai consonant from the vowel and tone marks stacked on
 * it — each mark then got its own full-width slot of noise, and "อ่านบทความ"
 * churned at nearly twice its settled width.
 */
const graphemes = (text: string): string[] =>
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
    : Array.from(text)

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
 * Churns `from` into `to`, calling `onText` with each frame's string and
 * `done` once every character has settled. Returns a cancel function.
 *
 * Each character gets its own window: it holds the outgoing letter until its
 * start frame, churns through noise until its end frame, then settles on the
 * incoming one. The windows are staggered and of different lengths, so the
 * phrase resolves raggedly from no particular direction rather than sweeping
 * left to right — a uniform stagger reads as a wipe, not a scramble.
 *
 * Split by grapheme, so Thai combining marks and emoji are never torn off the
 * character they belong to.
 */
function scramble(from: string, to: string, onText: (text: string) => void, done: () => void, pool: string[] = NOISE): () => void {
  let cancelled = false
  let raf = 0
  const a = graphemes(from)
  const b = graphemes(to)
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

  let frame = 0
  let last = 0

  const step = (now: number) => {
    if (cancelled) return
    if (now - last < 1000 / FPS) {
      raf = requestAnimationFrame(step)
      return
    }
    last = now

    let settled = 0
    const out = slots
      .map((slot) => {
        if (frame >= slot.end) {
          settled += 1
          return slot.to
        }
        if (frame < slot.start) return slot.from
        // A fresh character every other frame, not every one: churning at the
        // full frame rate is a blur rather than something being read. Drawn
        // rather than derived, so two runs never play back the same characters.
        const next = Math.floor((frame - slot.start) / 2)
        if (next !== slot.step) {
          slot.step = next
          slot.char = pool[Math.floor(Math.random() * pool.length)]
        }
        return slot.char
      })
      .join('')

    onText(out)
    frame += 1

    if (settled === slots.length) done()
    else raf = requestAnimationFrame(step)
  }

  raf = requestAnimationFrame(step)
  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
  }
}

const noiseFor = (text: string, pool: string[] = NOISE) =>
  graphemes(text)
    .map((c) => (c === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)]))
    .join('')

/**
 * Cycles through phrases, scrambling from one to the next — and scrambles the
 * first one in on arrival, out of noise, rather than showing it already settled.
 */
export function TextScramble({
  phrases,
  className,
  holdMs = 2200,
  world = false,
}: {
  phrases: string[]
  className?: string
  /** How long a settled phrase is left alone before the next one starts. */
  holdMs?: number
  /** Churn through the world's scripts rather than ASCII symbols. */
  world?: boolean
}) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  // The settled first phrase, matching what the server sent. The scramble takes
  // over on the next frame; generating noise during render would be a different
  // string on the client than in the markup, which is a hydration error.
  const [text, setText] = useState(phrases[0] ?? '')
  const [revealed, setRevealed] = useState(false)
  const cancel = useRef(() => {})

  useEffect(() => {
    if (reduce || phrases.length === 0) return

    const run = (from: string, to: string, done: () => void) => {
      cancel.current = scramble(from, to, setText, done, world ? WORLD : NOISE)
    }

    // The first phrase is scrambled in as well, from noise, with no wait — the
    // line should be resolving as the page arrives rather than sitting there
    // already settled for two seconds.
    if (!revealed) {
      const target = phrases[0] ?? ''
      run(noiseFor(target, world ? WORLD : NOISE), target, () => setRevealed(true))
      return () => cancel.current()
    }

    if (phrases.length < 2) return

    const next = (index + 1) % phrases.length
    const hold = setTimeout(() => {
      run(phrases[index] ?? '', phrases[next] ?? '', () => setIndex(next))
    }, holdMs)

    return () => {
      clearTimeout(hold)
      cancel.current()
    }
  }, [index, revealed, phrases, reduce, holdMs, world])

  // Reduced motion: just say it.
  if (reduce) return <span className={className}>{phrases[0]}</span>

  return (
    <span className={world ? `world-glyphs ${className ?? ''}` : className}>
      {/* The churn is noise, not words, so it is kept away from assistive tech;
          the settled phrase is announced on its own. */}
      <span aria-hidden>{text}</span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {phrases[index]}
      </span>
    </span>
  )
}

/**
 * A fixed label — a button's — that scrambles in on arrival and again whenever
 * the control it sits in is hovered or focused.
 *
 * The settled label always takes the space; the churn is laid over it out of
 * flow. Noise characters run wider than letters, so a frame that comes out
 * wider than the label is squeezed horizontally to fit — measured each frame —
 * rather than clipped (which cut the last characters off) or allowed to push
 * the button wider (which made it breathe under the pointer).
 */
export function HoverScramble({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  const [churn, setChurn] = useState<string | null>(null)
  const root = useRef<HTMLSpanElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const overlay = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduce) return
    const host = root.current?.closest('a, button') ?? root.current
    if (!host) return
    let stop = () => {}
    const play = () => {
      stop()
      stop = scramble(noiseFor(text, WORLD), text, setChurn, () => setChurn(null), WORLD)
    }
    play()
    host.addEventListener('pointerenter', play)
    host.addEventListener('focus', play)
    return () => {
      stop()
      host.removeEventListener('pointerenter', play)
      host.removeEventListener('focus', play)
    }
  }, [text, reduce])

  useLayoutEffect(() => {
    const el = overlay.current
    const box = label.current
    if (!el || !box) return
    el.style.transform = ''
    const over = el.scrollWidth / Math.max(1, box.offsetWidth)
    if (over > 1) el.style.transform = `scaleX(${1 / over})`
  }, [churn])

  return (
    <span ref={root} className={`relative inline-block ${className ?? ''}`}>
      <span ref={label} className={churn === null ? '' : 'invisible'}>
        {text}
      </span>
      {churn !== null && (
        <span ref={overlay} aria-hidden className="world-glyphs absolute top-0 left-0 origin-left whitespace-pre">
          {churn}
        </span>
      )}
    </span>
  )
}
