import { llmsFull } from '@/lib/llms'

/**
 * `/llms-full.txt` — the index, then everything it points at.
 *
 * The companion llmstxt.org describes for readers that would otherwise fetch
 * every page in turn and strip the HTML off each one. Same content, one request.
 */

export const revalidate = 3600

export async function GET() {
  return new Response(await llmsFull(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
