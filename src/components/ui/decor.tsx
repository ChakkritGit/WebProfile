'use client'

import { useEffect, useMemo, useState } from 'react'
import { useIsMounted } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/**
 * The sky this page load gets, drawn once when the script first runs.
 *
 * Module scope rather than state: it is the same for every `StarGrid` on the
 * page and it survives a client-side navigation, so walking to another page and
 * back does not reshuffle the stars — only a real page load does.
 */
let browserSky: number | undefined

/**
 * Purely decorative shapes. All are aria-hidden and pointer-events-none so they
 * never interfere with reading order or hit targets.
 */

export function Blob({
  className,
  color = 'var(--brand)',
  delay = 0,
}: {
  className?: string
  color?: string
  delay?: number
}) {
  return (
    <div
      aria-hidden
      className={cn('animate-blob pointer-events-none absolute rounded-full blur-3xl', className)}
      style={{ background: color, animationDelay: `${delay}s` }}
    />
  )
}

export function Squiggle({ className, color = 'var(--brand)' }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="-4 -4 128 28"
      fill="none"
      className={cn('pointer-events-none', className)}
      preserveAspectRatio="none"
    >
      <path
        d="M2 14C12 4 22 4 32 14s20 10 30 0 20-10 30 0 20 10 26 4"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StarBurst({ className, color = 'var(--sun)' }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={cn('pointer-events-none', className)}>
      <path
        d="M20 2c1.2 9.6 8.2 16.6 17.8 17.8C28.2 21 21.2 28 20 37.6 18.8 28 11.8 21 2.2 19.8 11.8 18.6 18.8 11.6 20 2Z"
        fill={color}
      />
    </svg>
  )
}

/** Hand-drawn-ish circle used to ring a word or an avatar. */
export function CircleScribble({ className, color = 'var(--brand)' }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 90"
      fill="none"
      // Stretch to the box instead of fitting inside it: with the aspect ratio
      // preserved the loop shrank to the middle of the name and circled two
      // syllables. The uneven scaling also thickens the vertical strokes, which
      // suits a pen mark.
      preserveAspectRatio="none"
      className={cn('pointer-events-none', className)}
    >
      {/* Drawn like a pen loop rather than an ellipse: the radii are uneven, the
          line is slightly off-axis, and it overshoots the start and crosses back
          over itself. A closed symmetric path read as a shape, not a scribble. */}
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path
          d="M66 13C34 16 9 29 10 47c1 21 46 34 96 34s85-14 84-34C189 27 151 13 103 11c-17-.7-32 .6-46 4.5-6 1.7-11 4-15 6.6"
          strokeWidth="3.6"
          opacity="0.92"
        />
        {/* A second, lighter pass riding just inside the first — the way a real
            pen doubles back when one loop does not look closed enough. */}
        <path
          d="M20 40c-2 4-2 8-1 11 4 15 44 26 88 26 42 0 76-11 79-25"
          strokeWidth="2.2"
          opacity="0.4"
        />
      </g>
    </svg>
  )
}

/** Chunky wave used as a section divider, echoing the old portfolio's footer. */
export function WaveDivider({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={cn('pointer-events-none block w-full', flip && 'rotate-180', className)}
    >
      <path
        d="M0 40c120-32 240-32 360 0s240 32 360 0 240-32 360 0 240 32 360 0v40H0Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Star positions are a fixed table rather than randomised: a random layout
 * would differ between the server and client render and trip hydration.
 * [leftPercent, topPercent, sizePx, delaySeconds, isSparkle]
 */
/**
 * Mulberry32: a hash-based generator, because the four-line congruential one it
 * replaced lays consecutive pairs on a lattice — as positions, that is stars in
 * faint diagonal rows.
 */
function generator(seed: number) {
  let state = (Math.floor(seed * 4294967296) || 1) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A sky, scattered from a number.
 *
 * The positions used to be a hand-written table, which meant every visitor saw
 * the same eighteen stars in the same places. This draws them instead — but from
 * a seed the server hands down, because `Math.random()` called during render
 * would disagree with itself across hydration and React would keep whichever
 * sky the server sent while the browser had drawn another.
 *
 * The seed the server renders with is a constant, so the markup it sends is the
 * same every time and hydration has nothing to argue about. The browser draws a
 * new one once it is running: a different sky on every visit, arriving while the
 * page is still settling, which for eighteen dots at a third of full opacity is
 * not something anybody sees happen.
 */
function scatter(seed: number, count = STAR_COUNT) {
  const next = generator(seed)

  return Array.from({ length: count }, () => {
    const sparkle = next() < 0.28
    return {
      left: 3 + next() * 94,
      top: 4 + next() * 92,
      size: sparkle ? 7 + Math.round(next() * 4) : 2 + Math.round(next() * 2),
      // Its own rhythm as well as its own place: one shared four-second beat had
      // them all breathing together.
      delay: Number((next() * 6).toFixed(2)),
      period: Number((3 + next() * 4.5).toFixed(2)),
      sparkle,
    }
  })
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 0c.9 6.4 4.7 10.2 11.1 11.1C16.7 12 12.9 15.8 12 22.2c-.9-6.4-4.7-10.2-11.1-11.1C7.3 10.2 11.1 6.4 12 0Z" />
    </svg>
  )
}

/**
 * Backdrop: a faint graph grid with a scattering of quietly twinkling stars.
 * Purely decorative and hidden from assistive tech.
 */
/**
 * Three meteors, rare and staggered.
 *
 * A cycle of about half a minute each, offset so they do not arrive together:
 * one streak every eight or nine seconds across the three, where eleven-second
 * cycles had them falling constantly.
 */
function meteors(seed: number, count = 3) {
  const next = generator(seed * 7.31 + 0.17)
  return Array.from({ length: count }, (_, i) => {
    const period = Number((27 + next() * 6).toFixed(1))
    return {
      left: 34 + next() * 62,
      top: next() * 38,
      period,
      // Spread across the cycle rather than bunched at the start: one every ten
      // seconds or so, which is a sky rather than a shower.
      delay: Number(((i * period) / count + next() * 2).toFixed(2)),
      length: 80 + Math.round(next() * 70),
    }
  })
}

/** How long a star takes to fade out before it moves, and to fade back in. */
const FADE = 700
const STAR_COUNT = 18

/** The grid is 64px, and the figures are counted from the bottom-left corner. */
const CELL = 64
/** Enough to cover a wide desktop and a tall hero; anything past the edge is
    clipped by the layer above. */
const COLS = 30
const ROWS = 14

export function StarGrid({
  className,
  seed = 0.4242,
  axes = false,
}: {
  className?: string
  /** The sky the server draws; the browser picks its own on arrival. */
  seed?: number
  /** Draw the figures up the left edge and along the bottom. */
  axes?: boolean
}) {
  // The server's constant, then the browser's own once it is running. Nothing is
  // set during render: `useIsMounted` is a `useSyncExternalStore` snapshot, which
  // is false on the server and true after hydration.
  const mounted = useIsMounted()
  if (mounted) browserSky ??= Math.random()
  const sky = mounted && browserSky !== undefined ? browserSky : seed

  /**
   * The sky keeps changing without being asked to, and is never seen doing it.
   *
   * One star every seven seconds fades out where it is, moves while nobody can
   * see it, and fades back in somewhere else — a star that slid across the sky
   * read as a bug, which is what it was. The meteors take new paths every fourth
   * turn, which they spend invisible anyway.
   */
  const [turn, setTurn] = useState(0)
  const [hidden, setHidden] = useState<number | null>(null)
  const [moved, setMoved] = useState<Record<number, { left: number; top: number }>>({})

  useEffect(() => {
    let landing: ReturnType<typeof setTimeout>
    const id = setInterval(() => {
      const star = Math.floor(Math.random() * STAR_COUNT)
      setHidden(star)
      landing = setTimeout(() => {
        setMoved((places) => ({
          ...places,
          [star]: { left: 3 + Math.random() * 94, top: 4 + Math.random() * 92 },
        }))
        setHidden(null)
        setTurn((t) => t + 1)
      }, FADE)
    }, 7000)

    return () => {
      clearInterval(id)
      clearTimeout(landing)
    }
  }, [])

  const stars = useMemo(
    () => scatter(sky).map((star, i) => (moved[i] ? { ...star, ...moved[i] } : star)),
    [sky, moved],
  )

  const streaks = useMemo(() => meteors(sky + Math.floor(turn / 4) * 0.91), [sky, turn])

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="star-grid absolute inset-0" />
      <div className="text-[var(--star)] absolute inset-0">
        {stars.map((star, i) => (
          // Two elements: the outer one holds the place and the fade, the inner
          // one twinkles. An animation beats an inline `opacity`, so the fade has
          // to live above it.
          <span
            key={i}
            className="absolute block"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              opacity: hidden === i ? 0 : 0.35,
              transition: `opacity ${FADE}ms ease`,
            }}
          >
            <span
              className="animate-twinkle block"
              style={{ animationDelay: `${star.delay}s`, animationDuration: `${star.period}s` }}
            >
              {star.sparkle ? (
                <Sparkle size={star.size} />
              ) : (
                <span
                  className="block rounded-full bg-current"
                  style={{ width: star.size, height: star.size }}
                />
              )}
            </span>
          </span>
        ))}

        {streaks.map((streak, i) => (
          <span
            key={`streak-${i}`}
            className="animate-shoot absolute block h-px opacity-0"
            style={{
              left: `${streak.left}%`,
              top: `${streak.top}%`,
              width: streak.length,
              animationDelay: `${streak.delay}s`,
              animationDuration: `${streak.period}s`,
              // Bright at the leading end, trailing away behind it.
              background: 'linear-gradient(to right, currentColor, transparent)',
            }}
          />
        ))}
      </div>

      {axes && (
        <div className="absolute inset-0 font-mono text-[10px] leading-none select-none">
          {/* Every cell carries its coordinate, quietly. */}
          <span className="text-muted/12 absolute inset-0">
            {Array.from({ length: COLS * ROWS }, (_, i) => {
              const x = i % COLS
              const y = Math.floor(i / COLS)
              // The first row and column are the axes; they carry a single
              // figure each rather than a pair.
              if (x === 0 || y === 0) return null
              return (
                <span
                  key={i}
                  className="absolute"
                  style={{ left: x * CELL + 5, bottom: y * CELL + 5 }}
                >
                  {x},{y}
                </span>
              )
            })}
          </span>

          {/* The axis figures themselves, and where each axis is going. */}
          <span className="text-muted/40 absolute inset-0">
            {Array.from({ length: COLS }, (_, x) => (
              <span key={`x-${x}`} className="absolute" style={{ left: x * CELL + 5, bottom: 5 }}>
                {x}
              </span>
            ))}
            {Array.from({ length: ROWS }, (_, y) => (
              <span key={`y-${y}`} className="absolute" style={{ left: 5, bottom: y * CELL + 5 }}>
                {y}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
