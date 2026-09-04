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
        // Inlined rather than an <img> so it can inherit currentColor — and drawn
        // freehand, like every other icon on the site. The ring is a curve
        // threaded through nine points whose radius wanders, so it comes out as a
        // pen going round rather than a compass; the star that sits in its gap is
        // likewise uneven, no two arms the same length.
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
            d="M19.88 9.12C19.25 8.47 17.61 6.14 16.11 5.26C14.61 4.38 12.54 3.61 10.88 3.82C9.23 4.03 7.41 5.29 6.18 6.53C4.94 7.77 3.68 9.59 3.46 11.25C3.25 12.92 4 15.03 4.91 16.52C5.82 18 7.33 19.54 8.9 20.16C10.47 20.79 12.65 20.74 14.32 20.27C15.99 19.8 18.15 17.82 18.92 17.33"
            strokeWidth="2.6"
          />
          <path
            d="M20.4 2.2q.5 2.5 2.4 3.4q-2.3.6-3.1 2.9q-.7-2.4-2.8-3.1q2.4-.7 3.5-3.2Z"
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
