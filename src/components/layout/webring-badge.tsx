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
        // The real badge's own geometry, lifted out of `public/webring.svg` and
        // painted in `currentColor` so it inverts with the theme. The version
        // that used to be here was a freehand approximation of it — which was
        // the point when the site was drawn, and is just a worse drawing now
        // that the asset itself is right there.
        <svg
          width={size}
          height={size}
          viewBox="0 0 416 416"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M53 128.8l-16-8.2a192 192 0 1094.7-88.9l7.1 16.6A174 174 0 1153 128.8z"
          />
          <path
            d="M94.7 92.3L82 126.5 62.6 95.7l-36.4-1.4 23.3-28-9.9-35.1 33.9 13.5 30.3-20.3-2.4 36.4L130 83.3l-35.3 9z"
            opacity="0.55"
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
