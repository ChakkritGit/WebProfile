import 'server-only'

import { asEditorDocument, readingMinutes } from './editor'
import { hasDatabase, prisma } from './prisma'
import { seedPosts, seedProjects } from '@/content/seed'
import type { ListOptions, PostRecord, ProjectRecord } from './content-types'
import { contentLocalePreference, type Locale } from '@/i18n/routing'

/**
 * Content access layer.
 *
 * Seed content is a fallback for an *unavailable* database — no DATABASE_URL, or
 * a query that threw. It is never a fallback for an empty result: "no featured
 * projects" and "that slug was deleted" are real answers and must be returned as
 * such, or the site starts resurrecting sample content over live data.
 */

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPost(row: any): PostRecord {
  const content = asEditorDocument(row.content)
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale as Locale,
    translationKey: row.translationKey ?? null,
    title: row.title,
    summary: row.summary ?? null,
    coverImage: row.coverImage ?? null,
    content,
    tags: row.tags ?? [],
    status: row.status,
    featured: Boolean(row.featured),
    publishedAt: iso(row.publishedAt),
    updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
    views: row.views ?? 0,
    readingMinutes: row.readingMinutes || readingMinutes(content),
  }
}

function toProject(row: any): ProjectRecord {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale as Locale,
    translationKey: row.translationKey ?? null,
    title: row.title,
    summary: row.summary ?? null,
    coverImage: row.coverImage ?? null,
    content: asEditorDocument(row.content),
    tags: row.tags ?? [],
    status: row.status,
    featured: Boolean(row.featured),
    publishedAt: iso(row.publishedAt),
    updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
    views: row.views ?? 0,
    role: row.role ?? null,
    stack: row.stack ?? [],
    year: row.year ?? null,
    liveUrl: row.liveUrl ?? null,
    repoUrl: row.repoUrl ?? null,
    sortOrder: row.sortOrder ?? 0,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function filterSeed<T extends { locale: string; status: string; tags: string[]; featured: boolean }>(
  rows: T[],
  { includeDrafts, tag, featuredOnly }: ListOptions,
): T[] {
  let out = [...rows]
  if (!includeDrafts) out = out.filter((r) => r.status === 'PUBLISHED')
  if (tag) out = out.filter((r) => r.tags.includes(tag))
  if (featuredOnly) out = out.filter((r) => r.featured)
  return out
}

type Variant = { id: string; locale: Locale; translationKey: string | null }

/**
 * Collapse translations to one entry each, in the best language for `locale`.
 *
 * Rows paired by `translationKey` are the same piece of content written twice;
 * showing both would list it twice. Rows without a key stand alone, so a Thai-only
 * post survives into the English and Japanese listings rather than vanishing.
 */
function preferLocale<T extends Variant>(rows: T[], locale: Locale): T[] {
  const preference = contentLocalePreference(locale)
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const key = row.translationKey || `#${row.id}`
    const group = groups.get(key)
    if (group) group.push(row)
    else groups.set(key, [row])
  }

  const picked: T[] = []
  for (const group of groups.values()) {
    picked.push(preference.map((l) => group.find((r) => r.locale === l)).find(Boolean) ?? group[0])
  }
  return picked
}

type Sortable = { publishedAt: string | null; updatedAt: string; views: number }

/** Newest first, treating an unpublished draft as "as recent as its last edit". */
function byRecent(a: Sortable, b: Sortable): number {
  return (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt)
}

/**
 * Ordering and `limit` move out of SQL: `take` would cut rows before translations
 * are collapsed, so a page of 3 could come back as 2.
 */
function finish<T extends Variant & Sortable>(
  rows: T[],
  options: ListOptions,
  compare: (a: T, b: T) => number,
): T[] {
  const out = options.allLocales ? rows : preferLocale(rows, options.locale)
  out.sort(compare)
  return typeof options.limit === 'number' ? out.slice(0, options.limit) : out
}

async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDatabase || !prisma) return fallback
  try {
    return await run()
  } catch (error) {
    console.error('[content] database read failed, serving seed content:', error)
    return fallback
  }
}

/* ------------------------------- posts -------------------------------- */

function comparePosts(options: ListOptions) {
  return options.orderBy === 'views'
    ? (a: PostRecord, b: PostRecord) => b.views - a.views || byRecent(a, b)
    : byRecent
}

export async function listPosts(options: ListOptions): Promise<PostRecord[]> {
  const fallback = finish(filterSeed(seedPosts, options), options, comparePosts(options))
  return safely(async () => {
    const rows = await prisma!.post.findMany({
      where: {
        ...(options.includeDrafts ? {} : { status: 'PUBLISHED' }),
        ...(options.tag ? { tags: { has: options.tag } } : {}),
        ...(options.featuredOnly ? { featured: true } : {}),
      },
    })
    return finish(rows.map(toPost), options, comparePosts(options))
  }, fallback)
}

export async function getPost(
  slug: string,
  locale: Locale,
  includeDrafts = false,
): Promise<PostRecord | null> {
  const preference = contentLocalePreference(locale)
  const readable = <T extends { slug: string; status: string }>(rows: T[]) =>
    rows.filter((r) => r.slug === slug && (includeDrafts || r.status === 'PUBLISHED'))
  const best = <T extends { locale: string }>(rows: T[]): T | null =>
    preference.map((l) => rows.find((r) => r.locale === l)).find(Boolean) ?? rows[0] ?? null

  const fallback = best(readable(seedPosts))

  return safely(async () => {
    // The slug is unique per locale, so this returns at most one row per language.
    // Reading `/ja/blog/<thai-only-post>` must serve the Thai text rather than 404 —
    // the listing offered the entry, so the URL has to resolve.
    const rows = await prisma!.post.findMany({ where: { slug } })
    const row = best(readable(rows))
    return row ? toPost(row) : null
  }, fallback)
}

export async function getPostById(id: string): Promise<PostRecord | null> {
  return safely(async () => {
    const row = await prisma!.post.findUnique({ where: { id } })
    return row ? toPost(row) : null
  }, seedPosts.find((p) => p.id === id) ?? null)
}

/* ------------------------------ projects ------------------------------ */

function compareProjects(options: ListOptions) {
  return options.orderBy === 'views'
    ? (a: ProjectRecord, b: ProjectRecord) => b.views - a.views || a.sortOrder - b.sortOrder
    : (a: ProjectRecord, b: ProjectRecord) => a.sortOrder - b.sortOrder || byRecent(a, b)
}

export async function listProjects(options: ListOptions): Promise<ProjectRecord[]> {
  const fallback = finish(filterSeed(seedProjects, options), options, compareProjects(options))
  return safely(async () => {
    const rows = await prisma!.project.findMany({
      where: {
        ...(options.includeDrafts ? {} : { status: 'PUBLISHED' }),
        ...(options.tag ? { tags: { has: options.tag } } : {}),
        ...(options.featuredOnly ? { featured: true } : {}),
      },
    })
    return finish(rows.map(toProject), options, compareProjects(options))
  }, fallback)
}

export async function getProject(
  slug: string,
  locale: Locale,
  includeDrafts = false,
): Promise<ProjectRecord | null> {
  const preference = contentLocalePreference(locale)
  const readable = <T extends { slug: string; status: string }>(rows: T[]) =>
    rows.filter((r) => r.slug === slug && (includeDrafts || r.status === 'PUBLISHED'))
  const best = <T extends { locale: string }>(rows: T[]): T | null =>
    preference.map((l) => rows.find((r) => r.locale === l)).find(Boolean) ?? rows[0] ?? null

  const fallback = best(readable(seedProjects))

  return safely(async () => {
    const rows = await prisma!.project.findMany({ where: { slug } })
    const row = best(readable(rows))
    return row ? toProject(row) : null
  }, fallback)
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  return safely(async () => {
    const row = await prisma!.project.findUnique({ where: { id } })
    return row ? toProject(row) : null
  }, seedProjects.find((p) => p.id === id) ?? null)
}

/* -------------------------------- tags -------------------------------- */

export function collectTags(rows: { tags: string[] }[]): string[] {
  const counts = new Map<string, number>()
  for (const row of rows) for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
}
