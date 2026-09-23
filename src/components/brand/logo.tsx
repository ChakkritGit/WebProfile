'use client'

import { FestivalOrnament, useFestival } from '@/components/layout/festival-decor'
import { cn } from '@/lib/utils'

/**
 * The mark: a blue square with a white C cut from straight segments, matching
 * the square frames and 1px rules everywhere else. Colours come from the brand
 * fill, which is the same electric blue in both themes.
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
      <rect width="48" height="48" fill="var(--brand)" />
      <path d="M33 14H15v20h18" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="square" />
    </svg>
  )
}

/** Full lockup used in the header. */
export function Logo({ label, className }: { label: string; className?: string }) {
  const festival = useFestival()
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative">
        <LogoMark size={32} />
        {festival && <FestivalOrnament id={festival.id} />}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
