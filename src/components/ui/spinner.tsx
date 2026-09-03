import { cn } from '@/lib/utils'

/**
 * Loading spinner drawn as a squiggle rather than a smooth arc.
 *
 * Both paths are a circle with a sine ripple riding on the radius, sampled and
 * smoothed — a plain `<circle>` was the last perfectly round thing left in the UI.
 */
const RING = 'M12.0 3.4Q14.4 3.3 15.5 3.8Q16.6 4.3 17.4 5.2Q18.2 6.1 18.7 7.1Q19.2 8.2 19.6 9.2Q20.1 10.3 20.4 11.4Q20.7 12.5 20.6 13.7Q20.5 14.9 19.9 15.9Q19.3 17.0 18.4 17.8Q17.4 18.5 16.4 18.9Q15.4 19.4 14.4 19.8Q13.3 20.2 12.2 20.4Q11.0 20.7 9.8 20.5Q8.6 20.4 7.6 19.7Q6.6 19.0 5.9 18.0Q5.3 17.0 4.8 15.9Q4.4 14.9 4.0 13.9Q3.6 12.8 3.4 11.6Q3.2 10.4 3.5 9.2Q3.9 8.1 4.7 7.2Q5.5 6.2 6.5 5.7Q7.5 5.1 8.5 4.7Q9.5 4.2 10.6 3.9L11.7 3.5'
const SWEEP = 'M11.3 3.4Q12.7 2.7 13.5 2.6Q14.3 2.5 15.1 2.8Q15.8 3.1 16.4 3.7Q16.9 4.2 17.2 5.0Q17.6 5.7 17.8 6.4Q18.0 7.1 18.2 7.8Q18.5 8.4 18.8 8.9Q19.1 9.4 19.6 9.9Q20.0 10.5 20.4 11.2Q20.9 11.8 21.2 12.6Q21.5 13.4 21.4 14.2Q21.3 14.9 20.9 15.6Q20.5 16.3 19.9 16.8Q19.2 17.3 18.4 17.6Q17.7 17.8 17.0 18.0L16.3 18.2'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex', className)}>
      {label && <span className="sr-only">{label}</span>}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-full motion-safe:animate-spin"
        style={{ animationDuration: '1.15s' }}
      >
        <path d={RING} fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.2" strokeLinecap="round" />
        <path d={SWEEP} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}
