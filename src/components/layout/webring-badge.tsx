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
}: {
  size?: number
  className?: string
  label?: string
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
      <Image
        alt={label}
        width={size}
        height={size}
        src="/webring.svg"
        // Static asset already sized for the badge; no responsive variants needed.
        unoptimized
      />
    </a>
  )
}
