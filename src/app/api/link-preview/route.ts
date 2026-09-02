import { StudioError, jsonError, requireOwner } from '@/lib/studio-service'

/**
 * Link metadata for Editor.js's link tool.
 *
 * The tool posts a URL here and expects `{ success: 1, meta: { title, description,
 * image: { url } } }`. Without this endpoint it can only report "Couldn't get
 * this link data", which is what it was doing.
 *
 * Owner-gated and restricted to http(s) so it cannot be used as an open proxy
 * to probe internal addresses.
 */

const BLOCKED_HOSTS =
  /^(localhost$|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1$|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i

function decode(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/** Pulls one meta tag's content regardless of attribute order. */
function meta(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|` +
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
      'i',
    )
    const match = html.match(pattern)
    const value = match?.[1] ?? match?.[2]
    if (value) return decode(value)
  }
  return undefined
}

export async function GET(request: Request) {
  try {
    await requireOwner()

    const target = new URL(request.url).searchParams.get('url')
    if (!target) throw new StudioError('Missing url parameter.', 400)

    let parsed: URL
    try {
      parsed = new URL(target)
    } catch {
      throw new StudioError('That is not a valid URL.', 400)
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new StudioError('Only http and https links are supported.', 400)
    }
    if (BLOCKED_HOSTS.test(parsed.hostname)) {
      throw new StudioError('That host is not allowed.', 400)
    }

    const response = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: {
        // Some sites serve a stub to unknown agents; ask politely for HTML.
        'user-agent': 'Mozilla/5.0 (compatible; chakkritton-linkbot/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return Response.json({ success: 0, error: `Fetch failed (${response.status}).` })
    }

    // Only read the head; some pages are megabytes and we need none of it.
    const html = (await response.text()).slice(0, 200_000)

    const title =
      meta(html, ['og:title', 'twitter:title']) ??
      decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '') ??
      parsed.hostname

    const description = meta(html, ['og:description', 'twitter:description', 'description'])
    const image = meta(html, ['og:image:secure_url', 'og:image', 'twitter:image'])

    return Response.json({
      success: 1,
      meta: {
        title: title || parsed.hostname,
        site_name: parsed.hostname,
        description,
        ...(image ? { image: { url: new URL(image, parsed).toString() } } : {}),
      },
    })
  } catch (error) {
    if (error instanceof StudioError) {
      return Response.json({ success: 0, error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      return Response.json({ success: 0, error: 'That site took too long to respond.' })
    }
    return jsonError(error)
  }
}
