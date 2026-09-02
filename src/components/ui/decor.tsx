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
    <svg aria-hidden viewBox="0 0 200 90" fill="none" className={cn('pointer-events-none', className)}>
      <path
        d="M100 6C56 6 12 18 8 44c-4 26 46 40 92 40s94-14 92-40C188 18 144 6 100 6Z"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="1 0"
        opacity="0.9"
      />
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
const STARS: [number, number, number, number, boolean][] = [
  [6, 18, 3, 0, false], [14, 62, 2, 1.6, false], [21, 30, 10, 0.8, true],
  [28, 78, 3, 2.4, false], [35, 12, 2, 1.1, false], [42, 52, 8, 3.1, true],
  [49, 86, 2, 0.4, false], [56, 24, 3, 2.0, false], [63, 68, 11, 1.3, true],
  [70, 40, 2, 2.8, false], [77, 16, 3, 0.6, false], [84, 74, 9, 1.9, true],
  [91, 34, 2, 3.4, false], [96, 58, 3, 1.2, false], [11, 44, 7, 2.6, true],
  [45, 92, 2, 0.9, false], [67, 6, 2, 3.7, false], [88, 48, 3, 0.2, false],
]

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
export function StarGrid({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="star-grid absolute inset-0" />
      <div className="text-[var(--star)] absolute inset-0">
        {STARS.map(([left, top, size, delay, sparkle], i) => (
          <span
            key={i}
            className="animate-twinkle absolute block"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              opacity: 0.35,
            }}
          >
            {sparkle ? (
              <Sparkle size={size} />
            ) : (
              <span
                className="block rounded-full bg-current"
                style={{ width: size, height: size }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
