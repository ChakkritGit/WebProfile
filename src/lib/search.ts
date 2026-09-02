import { slugify } from './slug'

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
