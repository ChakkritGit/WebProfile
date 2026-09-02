'use client'

import { Link } from '@/i18n/navigation'
import { buildQuery } from '@/lib/search'
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
  const chip = (label: string, href: string, isActive: boolean) => (
    <Link
      key={href}
      href={href}
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
      {chip(allLabel, `${basePath}${buildQuery({ q: query })}`, !active)}
      {tags.map((tag) =>
        chip(tag, `${basePath}${buildQuery({ tag, q: query })}`, active === tag),
      )}
    </div>
  )
}
