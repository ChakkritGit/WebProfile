import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Next.js 16 renamed the `middleware` convention to `proxy`.
export default createMiddleware(routing)

export const config = {
  /**
   * Skip API routes, Next internals, and paths that name a file.
   *
   * "Names a file" means the dot is in the *last* segment — `/Resume-en.pdf`,
   * `/llms.txt`, `/icon.svg`. Skipping every path with a dot anywhere let
   * `/nope.txt/blog` through to the app with `nope.txt` as its locale, where it
   * rendered the blog listing and answered 200. Those reach the proxy now, get
   * the default prefix, match no route under it, and 404 like any other bad URL.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\.[^/]*$).*)'],
}
