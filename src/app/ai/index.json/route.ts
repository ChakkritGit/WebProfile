import { listPosts, listProjects } from '@/lib/content'
import { toAiItems } from '@/lib/ai-index'

// Per request, like the feed and the sitemap; the CDN keeps it a minute and the
// Worker five, so a publish reaches the chat within about five minutes.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  // Each listing collapses translations to the best language for its locale;
  // together they hold every published record in both languages.
  const [thPosts, enPosts, thProjects, enProjects] = await Promise.all([
    listPosts({ locale: 'th' }),
    listPosts({ locale: 'en' }),
    listProjects({ locale: 'th' }),
    listProjects({ locale: 'en' }),
  ])
  return Response.json(
    { items: toAiItems([...thPosts, ...enPosts], [...thProjects, ...enProjects]) },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } },
  )
}
