import { slugify } from './slug'
import { yearMonthOf } from './utils'

/** URL-safe form of a tag. `Next.js` → `next-js`. */
export function tagSlug(tag: string): string {
  return slugify(tag, 'tag')
}

/** Resolves a slug back to the original tag label as authored. */
export function findTagBySlug(tags: string[], slug: string): string | null {
  const target = decodeURIComponent(slug).toLowerCase()
  return (
    tags.find((tag) => tagSlug(tag) === target) ??
    tags.find((tag) => tag.toLowerCase() === target) ??
    null
  )
}

interface Searchable {
  title: string
  summary: string | null
  tags: string[]
}

/**
 * Case-insensitive substring match over title, summary and tags.
 *
 * Deliberately not word-boundary based: Thai has no spaces between words, so
 * a substring match is what actually finds things in Thai content.
 */
export function matchesQuery(record: Searchable & { stack?: string[] }, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [record.title, record.summary ?? '', ...record.tags, ...(record.stack ?? [])]
    .join(' ')
    .toLowerCase()

  // Every whitespace-separated term must appear somewhere.
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

/** One row of the navbar's instant-search index (`/api/search`). */
export interface SearchEntry extends Searchable {
  kind: 'post' | 'project'
  href: string
  stack?: string[]
  publishedAt: string | null
}

export interface Paged<T> {
  items: T[]
  page: number
  totalPages: number
  total: number
}

export function paginate<T>(items: T[], page: number, perPage: number): Paged<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  // Clamp so a hand-edited ?page=99 shows the last page instead of nothing.
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * perPage
  return { items: items.slice(start, start + perPage), page: current, totalPages, total }
}

export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/** Builds a querystring, dropping empty values and the default page. */
export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || (key === 'page' && Number(value) === 1)) continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/* ------------------------------ by date ------------------------------- */

export interface DateFilter {
  year?: number
  month?: number
  sort: 'new' | 'old'
}

interface Dated {
  publishedAt: string | null
}

/** Reads `?year=&month=&sort=`; anything malformed is simply not a filter. */
export function parseDateFilter(params: { year?: string; month?: string; sort?: string }): DateFilter {
  const year = Number.parseInt(params.year ?? '', 10)
  const month = Number.parseInt(params.month ?? '', 10)
  return {
    year: Number.isFinite(year) ? year : undefined,
    month: month >= 1 && month <= 12 ? month : undefined,
    sort: params.sort === 'old' ? 'old' : 'new',
  }
}

/**
 * Keeps what was published in the chosen year and/or month, in the chosen
 * order. A month without a year means that month in any year.
 */
export function applyDateFilter<T extends Dated>(items: T[], filter: DateFilter): T[] {
  const kept = items.filter((item) => {
    if (!filter.year && !filter.month) return true
    const at = yearMonthOf(item.publishedAt)
    if (!at) return false
    return (!filter.year || at.year === filter.year) && (!filter.month || at.month === filter.month)
  })
  const time = (item: T) => (item.publishedAt ? Date.parse(item.publishedAt) : 0)
  return kept.sort((a, b) => (filter.sort === 'old' ? time(a) - time(b) : time(b) - time(a)))
}

/** Every `[year, month]` something was published in, for the filter's choices. */
export function publishedDates(items: Dated[]): [number, number][] {
  const seen = new Map<string, [number, number]>()
  for (const item of items) {
    const at = yearMonthOf(item.publishedAt)
    if (at) seen.set(`${at.year}-${at.month}`, [at.year, at.month])
  }
  return [...seen.values()]
}
