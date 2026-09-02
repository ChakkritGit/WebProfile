import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { StudioError, jsonError, requireDatabase, requireOwner } from '@/lib/studio-service'

const nameSchema = z
  .string()
  .trim()
  .min(1, 'A tag needs a name.')
  .max(40, 'Tags are limited to 40 characters.')

/** GET /api/tags — the master vocabulary, plus tags already in use. */
export async function GET() {
  try {
    await requireOwner()
    if (!prisma) return Response.json({ tags: [] })

    const [tags, posts, projects] = await Promise.all([
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      prisma.post.findMany({ select: { tags: true } }),
      prisma.project.findMany({ select: { tags: true, stack: true } }),
    ])

    // Anything already attached to content counts as part of the vocabulary,
    // even if it predates this table.
    const names = new Set(tags.map((t) => t.name))
    for (const row of posts) row.tags.forEach((t) => names.add(t))
    for (const row of projects) {
      row.tags.forEach((t) => names.add(t))
      row.stack.forEach((t) => names.add(t))
    }

    return Response.json({
      tags: [...names].sort((a, b) => a.localeCompare(b)),
    })
  } catch (error) {
    return jsonError(error)
  }
}

/** POST /api/tags — add a name to the master list. */
export async function POST(request: Request) {
  try {
    await requireOwner()
    const db = requireDatabase()

    const body = (await request.json()) as { name?: unknown }
    const parsed = nameSchema.safeParse(body.name)
    if (!parsed.success) {
      throw new StudioError(parsed.error.issues[0]?.message ?? 'Invalid tag.', 400)
    }

    // Idempotent: adding an existing tag is a no-op, not an error.
    const tag = await db.tag.upsert({
      where: { name: parsed.data },
      create: { name: parsed.data },
      update: {},
    })
    return Response.json({ name: tag.name }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}

/** DELETE /api/tags?name=… — remove from the vocabulary (content keeps its copy). */
export async function DELETE(request: Request) {
  try {
    await requireOwner()
    const db = requireDatabase()
    const name = new URL(request.url).searchParams.get('name')
    if (!name) throw new StudioError('Missing name parameter.', 400)

    await db.tag.deleteMany({ where: { name } })
    return Response.json({ ok: true })
  } catch (error) {
    return jsonError(error)
  }
}
