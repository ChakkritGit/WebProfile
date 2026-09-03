'use client'

import { FestivalOrnament, useFestival } from '@/components/layout/festival-decor'
import { cn } from '@/lib/utils'

/**
 * The "C" mark.
 *
 * Drawn as a stroked arc rather than a typeface glyph so it stays identical
 * across the header, the favicon and the OG card, and colours come from the
 * theme tokens so it inverts correctly in dark mode.
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
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="13"
        fill="var(--brand)"
        stroke="var(--line)"
        strokeWidth="3"
      />
      {/* open-sided C */}
      <path
        d="M33 16.8a12 12 0 1 0 0 14.4"
        fill="none"
        stroke="var(--brand-ink)"
        strokeWidth="5.6"
        strokeLinecap="round"
      />
      <circle cx="34.6" cy="24" r="3.4" fill="var(--mint)" stroke="var(--line)" strokeWidth="2" />
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
