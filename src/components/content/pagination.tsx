import { getTranslations } from 'next-intl/server'
import { PinLink } from './pin-link'
import { ArrowRightIcon } from '@/components/icons'
import { buildQuery } from '@/lib/search'
import { cn } from '@/lib/utils'

/** Compact page list: first, last, and a window around the current page. */
function pageWindow(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page, page - 1, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out: (number | 'gap')[] = []
  let previous = 0
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push('gap')
    out.push(p)
    previous = p
  }
  return out
}

export async function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number
  totalPages: number
  basePath: string
  query: Record<string, string | number | undefined>
}) {
  if (totalPages <= 1) return null
  const t = await getTranslations('common')

  const href = (target: number) => `${basePath}${buildQuery({ ...query, page: target })}`
  const linkClass = 'font-display grid h-10 min-w-10 place-items-center rounded-xl border-2 px-3 text-sm font-semibold transition-all'

  return (
    <nav aria-label={t('pageOf', { page, total: totalPages })} className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <PinLink href={href(page - 1)} rel="prev" className={cn(linkClass, 'border-line bg-surface sticker-hover shadow-[2px_2px_0_0_var(--shadow)]')}>
              <ArrowRightIcon className="size-4 rotate-180" />
              <span className="ms-1 hidden sm:inline">{t('previous')}</span>
            </PinLink>
          ) : (
            <span aria-hidden className={cn(linkClass, 'border-line-soft text-muted/50')}>
              <ArrowRightIcon className="size-4 rotate-180" />
              <span className="ms-1 hidden sm:inline">{t('previous')}</span>
            </span>
          )}
        </li>

        {pageWindow(page, totalPages).map((entry, i) =>
          entry === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden className="text-muted px-1">
              …
            </li>
          ) : (
            <li key={entry}>
              <PinLink
                href={href(entry)}
                aria-label={t('goToPage', { page: entry })}
                aria-current={entry === page ? 'page' : undefined}
                className={cn(
                  linkClass,
                  entry === page
                    ? 'border-line bg-brand text-brand-ink shadow-[2px_2px_0_0_var(--shadow)]'
                    : 'border-line-soft text-muted hover:border-line hover:text-ink',
                )}
              >
                {entry}
              </PinLink>
            </li>
          ),
        )}

        <li>
          {page < totalPages ? (
            <PinLink href={href(page + 1)} rel="next" className={cn(linkClass, 'border-line bg-surface sticker-hover shadow-[2px_2px_0_0_var(--shadow)]')}>
              <span className="me-1 hidden sm:inline">{t('next')}</span>
              <ArrowRightIcon className="size-4" />
            </PinLink>
          ) : (
            <span aria-hidden className={cn(linkClass, 'border-line-soft text-muted/50')}>
              <span className="me-1 hidden sm:inline">{t('next')}</span>
              <ArrowRightIcon className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
