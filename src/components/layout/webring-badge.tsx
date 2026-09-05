import Image from '@/components/ui/plain-image'
import { WEBRING_DOMAIN } from '@/config/site'
import { cn } from '@/lib/utils'

/**
 * Thai webring badge (วงแหวนเว็บ). The `#<domain>` fragment is what tells the
 * ring which member the visitor arrived from, so it must match the site's
 * registered domain exactly.
 */
export function WebringBadge({
  size = 32,
  className,
  label = 'วงแหวนเว็บ',
  mono = false,
}: {
  size?: number
  className?: string
  label?: string
  /** Draw in the current ink colour so it matches neighbouring icons. */
  mono?: boolean
}) {
  return (
    <a
      href={`https://webring.wonderful.software#${WEBRING_DOMAIN}`}
      title={label}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-transform duration-200',
        // Only spin the bare badge; framed ones are lifted by sticker-hover.
        className ? '' : 'rounded-full hover:scale-110 hover:-rotate-6',
        className,
      )}
    >
      {mono ? (
        // Inlined rather than an <img> so it can inherit currentColor — and drawn
        // freehand, like every other icon on the site. The ring is a curve
        // threaded through nine points whose radius wanders, so it comes out as a
        // pen going round rather than a compass. The gap and the star sit at the
        // upper left, where the original badge puts them.
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path
            d="M7.75 4.94C8.64 4.82 11.35 4 13.06 4.22C14.78 4.44 16.87 5.09 18.05 6.25C19.22 7.42 19.9 9.51 20.13 11.23C20.36 12.95 20.28 15.15 19.45 16.6C18.62 18.05 16.76 19.28 15.16 19.92C13.55 20.57 11.44 20.89 9.81 20.46C8.19 20.03 6.47 18.71 5.42 17.35C4.36 15.99 3.82 13.14 3.5 12.3"
            strokeWidth="2.6"
          />
          <path
            d="M4.5 2.5q.6 2.7 2.7 3.5q-2.5.8-3.4 3.2q-.8-2.6-3-3.3q2.6-.8 3.7-3.4Z"
            fill="currentColor"
            strokeWidth="0.9"
          />
        </svg>
      ) : (
        <Image
          alt={label}
          width={size}
          height={size}
          src="/webring.svg"
          // Static asset already sized for the badge; no responsive variants needed.
          unoptimized
        />
      )}
    </a>
  )
}
