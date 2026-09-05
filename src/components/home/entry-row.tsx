import Link from 'next/link'
import { ArrowRightIcon } from '@/components/icons'

/**
 * One line of a list, in place of a card.
 *
 * A grid of bordered cards is a good way to show three things and a poor way to
 * show a list: every item carries the same frame, so nothing stands out and the
 * eye has to enter each box separately. A row gives the title the full measure,
 * hangs the date in a column of its own, and separates items with a single line
 * — which is how anything meant to be scanned has been set for a century.
 *
 * Deliberately not a replacement for `ProjectCard` and `PostCard`. Those still
 * run the listing pages, where a card's picture and tags earn their space. This
 * is the front page, where three items are a preview and not the point.
 */
export function EntryRow({
  href,
  index,
  title,
  summary,
  meta,
}: {
  href: string
  index: number
  title: string
  summary?: string | null
  /** Short facts shown after the title: a date, a year, a role. */
  meta?: (string | null | undefined)[]
}) {
  const facts = (meta ?? []).filter(Boolean) as string[]

  return (
    <Link
      href={href}
      className="group border-line grid gap-x-6 gap-y-2 border-t py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline"
    >
      <span className="text-muted font-mono text-xs tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="min-w-0">
        <span className="group-hover:text-brand block text-lg font-semibold transition-colors sm:text-xl">
          {title}
        </span>
        {summary && (
          <span className="text-muted mt-1.5 line-clamp-2 block text-sm leading-relaxed">
            {summary}
          </span>
        )}
        {facts.length > 0 && (
          <span className="text-muted mt-2 block text-xs">{facts.join(' · ')}</span>
        )}
      </span>

      <ArrowRightIcon className="text-muted group-hover:text-brand hidden size-4 transition-transform group-hover:translate-x-1 sm:block" />
    </Link>
  )
}
