import {
  contentKindSchema,
  fieldErrors,
  postUpdateSchema,
  projectUpdateSchema,
} from '@/lib/studio-schema'
import {
  StudioError,
  derivedFields,
  jsonError,
  requireDatabase,
  requireOwner,
  revalidateContent,
  uniqueSlugFor,
} from '@/lib/studio-service'
import { mediaPathsIn, pruneOrphanedMedia } from '@/lib/media-cleanup'
import type { Prisma } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ kind: string; id: string }> }

async function resolve(ctx: Ctx) {
  await requireOwner()
  const db = requireDatabase()
  const { kind: rawKind, id } = await ctx.params

  const kindResult = contentKindSchema.safeParse(rawKind)
  if (!kindResult.success) throw new StudioError('Unknown content kind', 404)

  return { db, kind: kindResult.data, id }
}

/** PATCH /api/content/:kind/:id — partial update. */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { db, kind, id } = await resolve(ctx)
    const body: unknown = await request.json()

    if (kind === 'posts') {
      const parsed = postUpdateSchema.safeParse(body)
      if (!parsed.success) throw new StudioError('Validation failed', 400, fieldErrors(parsed.error))
      const input = parsed.data

      const existing = await db.post.findUnique({ where: { id } })
      if (!existing) throw new StudioError('Not found', 404)

      const data: Prisma.PostUpdateInput = {}
      if (input.title !== undefined) data.title = input.title
      if (input.locale !== undefined) data.locale = input.locale
      if (input.translationKey !== undefined) data.translationKey = input.translationKey
      if (input.coverImage !== undefined) data.coverImage = input.coverImage
      if (input.tags !== undefined) data.tags = input.tags
      if (input.featured !== undefined) data.featured = input.featured
      if (input.status !== undefined) data.status = input.status

      // Slug is recomputed only when the author touched the slug or the title.
      const slug =
        input.slug !== undefined || input.title !== undefined
          ? await uniqueSlugFor(
              kind,
              input.slug ?? existing.slug,
              input.title ?? existing.title,
              input.translationKey ?? existing.translationKey,
              id,
            )
          : existing.slug
      data.slug = slug

      if (input.content) {
        data.content = input.content as unknown as Prisma.InputJsonValue
        const derived = derivedFields(kind, input.content, input.summary ?? undefined)
        data.summary = derived.summary
        data.readingMinutes = derived.readingMinutes
      } else if (input.summary !== undefined) {
        data.summary = input.summary
      }

      // The first transition to PUBLISHED stamps the publication date.
      if (input.status === 'PUBLISHED' && !existing.publishedAt) data.publishedAt = new Date()

      // Snapshot before the write: whatever the edit drops — a replaced cover, a
      // deleted image block — is only detectable against the previous version.
      const previousMedia = mediaPathsIn(existing)
      const record = await db.post.update({ where: { id }, data })
      await pruneOrphanedMedia(previousMedia)
      revalidateContent(kind, record.slug)
      if (existing.slug !== record.slug) revalidateContent(kind, existing.slug)
      return Response.json({ id: record.id, slug: record.slug })
    }

    const parsed = projectUpdateSchema.safeParse(body)
    if (!parsed.success) throw new StudioError('Validation failed', 400, fieldErrors(parsed.error))
    const input = parsed.data

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) throw new StudioError('Not found', 404)

    const data: Prisma.ProjectUpdateInput = {}
    if (input.title !== undefined) data.title = input.title
    if (input.locale !== undefined) data.locale = input.locale
    if (input.translationKey !== undefined) data.translationKey = input.translationKey
    if (input.coverImage !== undefined) data.coverImage = input.coverImage
    if (input.tags !== undefined) data.tags = input.tags
    if (input.featured !== undefined) data.featured = input.featured
    if (input.status !== undefined) data.status = input.status
    if (input.role !== undefined) data.role = input.role
    if (input.stack !== undefined) data.stack = input.stack
    if (input.year !== undefined) data.year = input.year
    if (input.liveUrl !== undefined) data.liveUrl = input.liveUrl
    if (input.repoUrl !== undefined) data.repoUrl = input.repoUrl
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder

    const slug =
      input.slug !== undefined || input.title !== undefined
        ? await uniqueSlugFor(
            kind,
            input.slug ?? existing.slug,
            input.title ?? existing.title,
            input.translationKey ?? existing.translationKey,
            id,
          )
        : existing.slug
    data.slug = slug

    if (input.content) {
      data.content = input.content as unknown as Prisma.InputJsonValue
      data.summary = derivedFields(kind, input.content, input.summary ?? undefined).summary
    } else if (input.summary !== undefined) {
      data.summary = input.summary
    }

    if (input.status === 'PUBLISHED' && !existing.publishedAt) data.publishedAt = new Date()

    const previousMedia = mediaPathsIn(existing)
    const record = await db.project.update({ where: { id }, data })
    await pruneOrphanedMedia(previousMedia)
    revalidateContent(kind, record.slug)
    if (existing.slug !== record.slug) revalidateContent(kind, existing.slug)
    return Response.json({ id: record.id, slug: record.slug })
  } catch (error) {
    return jsonError(error)
  }
}

/** DELETE /api/content/:kind/:id */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { db, kind, id } = await resolve(ctx)

    const record =
      kind === 'posts'
        ? await db.post.delete({ where: { id } })
        : await db.project.delete({ where: { id } })

    // The row is gone, so its uploads are orphans unless a translation shares them.
    await pruneOrphanedMedia(mediaPathsIn(record))
    revalidateContent(kind, record.slug)
    return Response.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
