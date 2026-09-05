'use client'

import { FestivalOrnament, useFestival } from '@/components/layout/festival-decor'
import { cn } from '@/lib/utils'

/**
 * The "C" mark.
 *
 * The same letter as before, drawn with a compass instead of a pen: one ring,
 * one gap, no fill, no outline round the tile. It has to hold at 20px in the
 * header and at 512px as an app icon, which a stroked circle does and a filled
 * sticker with a drawn edge does not.
 *
 * `currentColor`, not `--brand`: the mark takes the colour of whatever it sits
 * in, so it is ink in the header and stays legible on any surface. The red is
 * spent on the one button that matters, not on the logo as well.
 */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      fill="none"
      className={cn('shrink-0', className)}
    >
      <path
        d="M35 14.5A15 15 0 1 0 35 33.5"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
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
