import Image from 'next/image'
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
        // Inlined rather than an <img> so it can inherit currentColor. The ring
        // used to be a curve threaded through nine points of wandering radius —
        // a pen going round rather than a compass. It is an arc now, with the
        // gap and the star still at the upper left, where the original badge
        // puts them.
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
            d="M7.6 4.6A8.6 8.6 0 1 1 3.6 12.2"
            strokeWidth="2.4"
          />
          <path
            d="M4.4 2.2 5.55 5.05 8.4 6.2 5.55 7.35 4.4 10.2 3.25 7.35 0.4 6.2 3.25 5.05Z"
            fill="currentColor"
            strokeWidth="0.6"
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
