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
  /** Use the black/white cut, so it sits in a row of ink-coloured icons. */
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
        /* The badge as it ships, not a redrawing of it. `public/` carries a black
           and a white cut of the same artwork for exactly this case: a row of
           ink-coloured tiles, where the crimson original would be the one thing
           shouting. Two tags rather than one recoloured tag, because an `<img>`
           cannot inherit `currentColor` and this branch has no filters left to
           fake it with — only one of the two is ever displayed, so only one is
           ever read out. */
        <>
          <Image
            alt={label}
            width={size}
            height={size}
            src="/webring.black.svg"
            className="dark:hidden"
            unoptimized
          />
          <Image
            alt={label}
            width={size}
            height={size}
            src="/webring.white.svg"
            className="hidden dark:block"
            unoptimized
          />
        </>
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
