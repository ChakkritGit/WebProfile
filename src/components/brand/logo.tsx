'use client'

import { FestivalOrnament, useFestival } from '@/components/layout/festival-decor'
import { cn } from '@/lib/utils'

/**
 * The "C" mark, drawn by hand.
 *
 * A stroked arc rather than a typeface glyph, so it stays identical wherever it
 * is used and needs no font present; colours come from the theme tokens so it
 * inverts correctly in the dark.
 *
 * Nothing here is true. The tile is one closed path with four corners of
 * different roundness and sides that bow slightly — a `rect` with a single `rx`
 * was the one perfectly machined shape left on a site where every other frame,
 * rule and icon is out of round. It has to be a closed path rather than the
 * open multi-stroke `handRect` the icons use, because this one is filled.
 */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path
        d="M15.4 3.1Q24.6 1.9 34.1 3.3Q44.7 4.4 45.2 14.4Q46.4 24.7 44.9 34.5Q44.1 44.5 33.5 45.2Q24 46.4 14.3 45Q3.7 44 3.2 33.7Q1.9 24.2 3.3 14.5Q4.1 4 15.4 3.1Z"
        fill="var(--brand)"
        stroke="var(--line)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* The C, opening to the right, drawn in four unequal sweeps rather than
          one arc — a perfect circle segment gave it away next to everything
          else on the page. */}
      <path
        d="M33.2 16.9Q23 11.1 15.9 16.6Q10.4 20.8 12.1 26.6Q14.5 34.6 24.8 34.6Q30 34.4 33.5 30.7"
        fill="none"
        stroke="var(--brand-ink)"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Full lockup used in the header. */
export function Logo({ label, className }: { label: string; className?: string }) {
  const festival = useFestival()
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative transition-transform duration-300 group-hover:-rotate-12">
        <LogoMark size={36} />
        {festival && <FestivalOrnament id={festival.id} />}
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">{label}</span>
    </span>
  )
}
