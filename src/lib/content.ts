import 'server-only'

import { asEditorDocument, readingMinutes } from './editor'
import { hasDatabase, prisma } from './prisma'
import { seedPosts, seedProjects } from '@/content/seed'
import type { ListOptions, PostRecord, ProjectRecord } from './content-types'
import type { Locale } from '@/i18n/routing'

/**
 * Content access layer.
 *
 * Every read falls back to the bundled seed content when Supabase is not
 * configured or unreachable, so the site always renders — during `next build`,
 * in a fresh clone, and if the database has a hiccup in production.
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
  { locale, includeDrafts, tag, featuredOnly, limit }: ListOptions,
): T[] {
  let out = rows.filter((r) => r.locale === locale)
  if (!includeDrafts) out = out.filter((r) => r.status === 'PUBLISHED')
  if (tag) out = out.filter((r) => r.tags.includes(tag))
  if (featuredOnly) out = out.filter((r) => r.featured)
  return typeof limit === 'number' ? out.slice(0, limit) : out
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

export async function listPosts(options: ListOptions): Promise<PostRecord[]> {
  const fallback = filterSeed(seedPosts, options)
  return safely(async () => {
    const rows = await prisma!.post.findMany({
      where: {
        locale: options.locale,
        ...(options.includeDrafts ? {} : { status: 'PUBLISHED' }),
        ...(options.tag ? { tags: { has: options.tag } } : {}),
        ...(options.featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      ...(options.limit ? { take: options.limit } : {}),
    })
    return rows.length ? rows.map(toPost) : fallback
  }, fallback)
}

export async function getPost(
  slug: string,
  locale: Locale,
  includeDrafts = false,
): Promise<PostRecord | null> {
  const fallback =
    seedPosts.find(
      (p) => p.slug === slug && p.locale === locale && (includeDrafts || p.status === 'PUBLISHED'),
    ) ?? null

  return safely(async () => {
    const row = await prisma!.post.findUnique({ where: { slug_locale: { slug, locale } } })
    if (!row) return fallback
    if (!includeDrafts && row.status !== 'PUBLISHED') return null
    return toPost(row)
  }, fallback)
}

export async function getPostById(id: string): Promise<PostRecord | null> {
  return safely(async () => {
    const row = await prisma!.post.findUnique({ where: { id } })
    return row ? toPost(row) : null
  }, seedPosts.find((p) => p.id === id) ?? null)
}

/* ------------------------------ projects ------------------------------ */

export async function listProjects(options: ListOptions): Promise<ProjectRecord[]> {
  const fallback = filterSeed(seedProjects, options).sort((a, b) => a.sortOrder - b.sortOrder)
  return safely(async () => {
    const rows = await prisma!.project.findMany({
      where: {
        locale: options.locale,
        ...(options.includeDrafts ? {} : { status: 'PUBLISHED' }),
        ...(options.tag ? { tags: { has: options.tag } } : {}),
        ...(options.featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
      ...(options.limit ? { take: options.limit } : {}),
    })
    return rows.length ? rows.map(toProject) : fallback
  }, fallback)
}

export async function getProject(
  slug: string,
  locale: Locale,
  includeDrafts = false,
): Promise<ProjectRecord | null> {
  const fallback =
    seedProjects.find(
      (p) => p.slug === slug && p.locale === locale && (includeDrafts || p.status === 'PUBLISHED'),
    ) ?? null

  return safely(async () => {
    const row = await prisma!.project.findUnique({ where: { slug_locale: { slug, locale } } })
    if (!row) return fallback
    if (!includeDrafts && row.status !== 'PUBLISHED') return null
    return toProject(row)
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
