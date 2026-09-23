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
  keep,
}: {
  tags: string[]
  active?: string
  allLabel: string
  basePath: string
  query?: string
  /** Other filters (year, month, sort) a tag change keeps. */
  keep?: Record<string, string | undefined>
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
        'border px-3 py-1.5 font-mono text-xs uppercase no-underline transition-colors',
        isActive
          ? 'border-brand bg-brand text-brand-ink'
          : 'border-line text-ink-soft hover:border-line-strong hover:text-brand-strong',
      )}
    >
      {label}
    </Link>
  )

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {chip('__all', allLabel, `${basePath}${buildQuery({ ...keep, q: query })}`, !active)}
      {tags.map((tag) =>
        chip(tag, tag, `${basePath}${buildQuery({ ...keep, tag, q: query })}`, active === tag),
      )}
    </div>
  )
}
