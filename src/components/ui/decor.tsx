import { cn } from '@/lib/utils'

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
 * A sky, scattered from a number.
 *
 * The positions used to be a hand-written table, which meant every visitor saw
 * the same eighteen stars in the same places. This draws them instead — but from
 * a seed the server hands down, because `Math.random()` called during render
 * would disagree with itself across hydration and React would keep whichever
 * sky the server sent while the browser had drawn another.
 *
 * The seed comes from the server on every render, and these pages revalidate, so
 * the sky is different from one visit to the next without any of that.
 */
function scatter(seed: number, count = 18) {
  // A linear congruential generator: four lines, repeatable, and nobody needs
  // more randomness than this to place a dot.
  let state = Math.floor(seed * 4294967296) || 1
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  return Array.from({ length: count }, () => {
    const sparkle = next() < 0.28
    return {
      left: 3 + next() * 94,
      top: 4 + next() * 92,
      size: sparkle ? 7 + Math.round(next() * 4) : 2 + Math.round(next() * 2),
      delay: Number((next() * 4).toFixed(2)),
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
export function StarGrid({ className, seed = 0.4242 }: { className?: string; seed?: number }) {
  const stars = scatter(seed)

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="star-grid absolute inset-0" />
      <div className="text-[var(--star)] absolute inset-0">
        {stars.map((star, i) => (
          <span
            key={i}
            className="animate-twinkle absolute block"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              opacity: 0.35,
            }}
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
        ))}
      </div>
    </div>
  )
}
