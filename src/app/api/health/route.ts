import { prisma } from '@/lib/prisma'

// Public by design: the status worker polls it. It gives booleans and timings only, never error text.
const headers = { 'Cache-Control': 'public, s-maxage=15' }

export async function GET() {
  if (!prisma) return Response.json({ ok: false }, { status: 503, headers })
  const t0 = performance.now()
  const ms = () => Math.round(performance.now() - t0)
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    return Response.json({ ok: true, db: { ok: true, ms: ms() } }, { headers })
  } catch {
    return Response.json({ ok: false, db: { ok: false, ms: ms() } }, { status: 503, headers })
  }
}
