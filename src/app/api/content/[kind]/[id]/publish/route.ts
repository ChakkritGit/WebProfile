import { contentKindSchema } from '@/lib/studio-schema'
import { ContentStatus } from '@/generated/prisma/enums'
import {
  StudioError,
  jsonError,
  requireDatabase,
  requireOwner,
  revalidateContent,
} from '@/lib/studio-service'

/** POST /api/content/:kind/:id/publish — toggle between DRAFT and PUBLISHED. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    await requireOwner()
    const db = requireDatabase()
    const { kind: rawKind, id } = await params

    const kindResult = contentKindSchema.safeParse(rawKind)
    if (!kindResult.success) throw new StudioError('Unknown content kind', 404)
    const kind = kindResult.data

    const existing =
      kind === 'posts'
        ? await db.post.findUnique({ where: { id } })
        : await db.project.findUnique({ where: { id } })
    if (!existing) throw new StudioError('Not found', 404)

    const status =
      existing.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED
    const data = {
      status,
      // Keep the original publication date once set; unpublishing is reversible.
      publishedAt:
        status === ContentStatus.PUBLISHED
          ? (existing.publishedAt ?? new Date())
          : existing.publishedAt,
    }

    const record =
      kind === 'posts'
        ? await db.post.update({ where: { id }, data })
        : await db.project.update({ where: { id }, data })

    revalidateContent(kind, record.slug)
    return Response.json({ id: record.id, status: record.status })
  } catch (error) {
    return jsonError(error)
  }
}
