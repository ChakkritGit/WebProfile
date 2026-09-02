import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

const bodySchema = z.object({
  kind: z.enum(['post', 'project']),
  slug: z.string().trim().min(1).max(160),
  locale: z.enum(routing.locales),
})

/**
 * POST /api/views — record one view.
 *
 * Public by design: it only ever increments a counter on a published record.
 * The client sends this once per session per item (see ViewTracker), so a
 * reload does not inflate the number. It is a popularity signal, not analytics —
 * no identifiers are stored.
 */
export async function POST(request: Request) {
  if (!prisma) return Response.json({ ok: false }, { status: 200 })

  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return Response.json({ ok: false }, { status: 400 })
    const { kind, slug, locale } = parsed.data

    // updateMany + a status filter means an unpublished or missing record is a
    // silent no-op rather than an error the visitor could probe.
    const where = { slug, locale, status: 'PUBLISHED' as const }
    if (kind === 'post') await prisma.post.updateMany({ where, data: { views: { increment: 1 } } })
    else await prisma.project.updateMany({ where, data: { views: { increment: 1 } } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[views] increment failed:', error)
    return Response.json({ ok: false }, { status: 200 })
  }
}
