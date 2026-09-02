import { contentKindSchema, fieldErrors, postSchema, projectSchema } from '@/lib/studio-schema'
import {
  StudioError,
  derivedFields,
  jsonError,
  requireDatabase,
  requireOwner,
  revalidateContent,
  uniqueSlugFor,
} from '@/lib/studio-service'
import type { Prisma } from '@/generated/prisma/client'

/**
 * POST /api/content/posts | /api/content/projects — create a record.
 *
 * The two kinds are handled in explicit branches rather than through a shared
 * generic: it keeps the Prisma create payloads exactly typed per model.
 */
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  try {
    await requireOwner()
    const db = requireDatabase()

    const kindResult = contentKindSchema.safeParse((await params).kind)
    if (!kindResult.success) throw new StudioError('Unknown content kind', 404)
    const kind = kindResult.data

    const body: unknown = await request.json()

    if (kind === 'posts') {
      const parsed = postSchema.safeParse(body)
      if (!parsed.success) throw new StudioError('Validation failed', 400, fieldErrors(parsed.error))
      const input = parsed.data

      const record = await db.post.create({
        data: {
          title: input.title,
          slug: await uniqueSlugFor(kind, input.slug, input.title, input.translationKey),
          locale: input.locale,
          translationKey: input.translationKey,
          coverImage: input.coverImage,
          tags: input.tags,
          status: input.status,
          featured: input.featured,
          content: input.content as unknown as Prisma.InputJsonValue,
          publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
          ...derivedFields(kind, input.content, input.summary ?? undefined),
        },
      })

      revalidateContent(kind, record.slug)
      return Response.json({ id: record.id, slug: record.slug }, { status: 201 })
    }

    const parsed = projectSchema.safeParse(body)
    if (!parsed.success) throw new StudioError('Validation failed', 400, fieldErrors(parsed.error))
    const input = parsed.data

    const record = await db.project.create({
      data: {
        title: input.title,
        slug: await uniqueSlugFor(kind, input.slug, input.title, input.translationKey),
        locale: input.locale,
        translationKey: input.translationKey,
        coverImage: input.coverImage,
        tags: input.tags,
        status: input.status,
        featured: input.featured,
        content: input.content as unknown as Prisma.InputJsonValue,
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        role: input.role,
        stack: input.stack,
        year: input.year,
        liveUrl: input.liveUrl,
        repoUrl: input.repoUrl,
        sortOrder: input.sortOrder,
        summary: derivedFields(kind, input.content, input.summary ?? undefined).summary,
      },
    })

    revalidateContent(kind, record.slug)
    return Response.json({ id: record.id, slug: record.slug }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
