import { cn } from '@/lib/utils'

/**
 * Loading spinner drawn as a wobbly hand-inked ring rather than a smooth arc,
 * so it belongs to the same drawn language as the rest of the UI.
 */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex', className)}>
      {label && <span className="sr-only">{label}</span>}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-full motion-safe:animate-spin"
        style={{ animationDuration: '1.1s' }}
      >
        {/* track */}
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.22"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        {/* the moving arc, deliberately uneven */}
        <path
          d="M12 3a9 9 0 0 1 7.6 4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
