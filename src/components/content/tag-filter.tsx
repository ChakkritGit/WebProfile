'use client'

import { Link } from '@/i18n/navigation'
import { buildQuery } from '@/lib/search'
import { pinScroll } from '@/lib/pin-scroll'
import { cn } from '@/lib/utils'

/**
 * Tag filter as links (not client state) so each filtered view is a real,
 * shareable, crawlable URL. Selecting a tag preserves the current search term
 * and always resets to page 1.
 */
export function TagFilter({
  tags,
  active,
  allLabel,
  basePath,
  query = '',
}: {
  tags: string[]
  active?: string
  allLabel: string
  basePath: string
  query?: string
}) {
  // The key must be the tag's identity, not the href. Href encodes the current
  // filter state, so keying on it remounted every chip on each change — which
  // moved focus to a fresh node and made the browser scroll it into view.
  const chip = (key: string, label: string, href: string, isActive: boolean) => (
    <Link
      key={key}
      href={href}
      // Refining a filter should not throw the reader back to the top.
      scroll={false}
      onClick={() => pinScroll()}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'font-display rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-all',
        isActive
          ? 'border-line bg-brand text-brand-ink shadow-[2px_2px_0_0_var(--shadow)]'
          : 'border-line-soft text-muted hover:border-line hover:text-ink',
      )}
    >
      {label}
    </Link>
  )

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {chip('__all', allLabel, `${basePath}${buildQuery({ q: query })}`, !active)}
      {tags.map((tag) =>
        chip(tag, tag, `${basePath}${buildQuery({ tag, q: query })}`, active === tag),
      )}
    </div>
  )
}
