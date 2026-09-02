import 'server-only'

import { revalidatePath } from 'next/cache'
import { getOwnerSession } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'
import { autoSummary, readingMinutes, type EditorDocument } from '@/lib/editor'
import { routing } from '@/i18n/routing'
import type { ContentKindParam } from '@/lib/studio-schema'

export class StudioError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message)
  }
}

/** Throws a 401 StudioError unless the caller is the allow-listed owner. */
export async function requireOwner() {
  const session = await getOwnerSession()
  if (!session) throw new StudioError('Unauthorized', 401)
  return session
}

/** Throws a 503 StudioError when Supabase is not configured yet. */
export function requireDatabase() {
  if (!prisma) {
    throw new StudioError(
      'No database configured. Set DATABASE_URL (and DIRECT_URL) in .env, then run `npx prisma migrate deploy`.',
      503,
    )
  }
  return prisma
}

/**
 * Builds a slug that is unique within a locale. `excludeId` lets an update keep
 * its own slug instead of colliding with itself.
 */
export async function uniqueSlugFor(
  kind: ContentKindParam,
  desired: string,
  title: string,
  locale: string,
  excludeId?: string,
): Promise<string> {
  const db = requireDatabase()
  const root = slugify(desired || title, 'untitled')

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`
    const existing =
      kind === 'posts'
        ? await db.post.findUnique({ where: { slug_locale: { slug: candidate, locale } } })
        : await db.project.findUnique({ where: { slug_locale: { slug: candidate, locale } } })

    if (!existing || existing.id === excludeId) return candidate
  }
  // Extremely unlikely; a timestamp suffix always terminates the loop.
  return `${root}-${Date.now().toString(36)}`
}

/** Refreshes every cached route that could show this record. */
export function revalidateContent(kind: ContentKindParam, slug?: string) {
  const section = kind === 'posts' ? 'blog' : 'projects'
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
    revalidatePath(`${prefix}/`)
    revalidatePath(`${prefix}/${section}`)
    if (slug) revalidatePath(`${prefix}/${section}/${slug}`)
  }
  revalidatePath('/sitemap.xml')
  revalidatePath('/feed.xml')
}

/** Fields the server always derives rather than trusting from the client. */
export function derivedFields(kind: ContentKindParam, content: EditorDocument, summary?: string) {
  const resolvedSummary = summary?.trim() || autoSummary(content) || null
  return kind === 'posts'
    ? { summary: resolvedSummary, readingMinutes: readingMinutes(content) }
    : { summary: resolvedSummary }
}

export function jsonError(error: unknown) {
  if (error instanceof StudioError) {
    return Response.json(
      { error: error.message, ...(error.fields ? { fields: error.fields } : {}) },
      { status: error.status },
    )
  }
  console.error('[studio] unexpected error:', error)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
