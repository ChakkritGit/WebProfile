import { llmsIndex } from '@/lib/llms'

/**
 * `/llms.txt`, as specified at llmstxt.org.
 *
 * A model reading this site otherwise gets HTML built for a browser —
 * navigation, a theme toggle, a table of contents, a footer — and has to guess
 * which part is the writing. This is the same site as an index.
 */

// Written from the database, so a publish shows up here as it does everywhere
// else rather than being frozen into the build.
export const revalidate = 3600

export async function GET() {
  return new Response(await llmsIndex(), {
    headers: {
      // `text/plain` rather than `text/markdown`: a browser opening the URL
      // should show the file, not download it.
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
