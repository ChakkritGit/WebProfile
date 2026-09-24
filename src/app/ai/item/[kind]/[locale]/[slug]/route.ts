import { getPost, getProject } from '@/lib/content'
import { documentToText } from '@/lib/editor'
import { decodeParam } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const MAX = 6000

/** One published item's words as plain text, for the Worker to quote from. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; locale: string; slug: string }> },
): Promise<Response> {
  const { kind, locale, slug: raw } = await params
  const slug = decodeParam(raw).replace(/\.txt$/, '')
  if ((kind !== 'post' && kind !== 'project') || (locale !== 'th' && locale !== 'en')) {
    return new Response('Not found', { status: 404 })
  }
  const record = kind === 'post' ? await getPost(slug, locale) : await getProject(slug, locale)
  // getPost/getProject fall back to another language; the index asked for this one.
  if (!record || record.locale !== locale) return new Response('Not found', { status: 404 })
  const text = [record.title, record.summary ?? '', documentToText(record.content)].join('\n\n').slice(0, MAX)
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
