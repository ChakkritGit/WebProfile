import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

const querySchema = z.object({
  kind: z.enum(['post', 'project']),
  slug: z.string().trim().min(1).max(160),
  locale: z.enum(routing.locales),
})

/**
 * POST /api/views - record one view.
 *
 * Public by design: it only ever increments a counter on a published record.
 * The client sends this once per session per item (see ViewCount), so a
 * reload does not inflate the number. It is a popularity signal, not analytics -
 * no identifiers are stored.
 */
export async function POST(request: Request) {
  if (!prisma) return Response.json({ ok: false }, { status: 200 })

  try {
    const parsed = querySchema.safeParse(await request.json())
    if (!parsed.success) return Response.json({ ok: false }, { status: 400 })
    const { kind, slug, locale } = parsed.data

    // updateMany + a status filter means an unpublished or missing record is a
    // silent no-op rather than an error the visitor could probe.
    const where = { slug, locale, status: 'PUBLISHED' as const }
    const data = { views: { increment: 1 } }
    const select = { views: true }
    let row
    if (kind === 'post') {
      await prisma.post.updateMany({ where, data })
      row = await prisma.post.findFirst({ where, select })
    } else {
      await prisma.project.updateMany({ where, data })
      row = await prisma.project.findFirst({ where, select })
    }

    return Response.json({ ok: true, views: row?.views ?? null })
  } catch (error) {
    console.error('[views] increment failed:', error)
    return Response.json({ ok: false }, { status: 200 })
  }
}

/**
 * GET /api/views?kind=&slug=&locale= - the current count, without counting.
 *
 * The article pages are cached for a day, so the browser asks for the live
 * number here. The CDN may hold an answer for a minute.
 */
export async function GET(request: Request) {
  const respond = (views: number | null) =>
    Response.json(
      { views },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  if (!prisma) return Response.json({ views: null })

  try {
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
    if (!parsed.success) return Response.json({ views: null }, { status: 400 })
    const { kind, slug, locale } = parsed.data

    const where = { slug, locale, status: 'PUBLISHED' as const }
    const select = { views: true }
    const row =
      kind === 'post'
        ? await prisma.post.findFirst({ where, select })
        : await prisma.project.findFirst({ where, select })

    return respond(row?.views ?? null)
  } catch (error) {
    console.error('[views] read failed:', error)
    return Response.json({ views: null })
  }
}
