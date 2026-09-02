import { cn } from '@/lib/utils'

/**
 * Placeholder block shown while data is in flight.
 *
 * `aria-hidden` plus a live-region label on the container is the accessible
 * pairing: a screen reader hears "loading", not a stack of empty boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('bg-line-soft animate-pulse rounded-lg', className)}
    />
  )
}

/** A row of pill-shaped placeholders, sized to look like tags. */
export function SkeletonChips({ count = 6, label }: { count?: number; label: string }) {
  // Varied widths read as content rather than a loading bar.
  const widths = ['w-16', 'w-24', 'w-20', 'w-28', 'w-14', 'w-24', 'w-20', 'w-16']
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-wrap gap-1.5">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('h-7 rounded-full', widths[i % widths.length])} />
      ))}
    </div>
  )
}

export function SkeletonLines({
  count = 3,
  label,
  className,
}: {
  count?: number
  label: string
  className?: string
}) {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3']
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn('space-y-3', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', widths[i % widths.length])} />
      ))}
    </div>
  )
}
