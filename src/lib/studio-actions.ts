'use server'

import { requireOwner, revalidateContent } from '@/lib/studio-service'
import type { ContentKindParam } from '@/lib/studio-schema'

/**
 * Clears the public pages from the author's own browser after a write.
 *
 * The write went through an API route, which already revalidated the server's
 * cache. But the browser keeps its own copy of pages it has prefetched or
 * visited — up to five minutes for a static page — and a route handler's
 * `revalidatePath` does not reach it; only a Server Function's does. So an
 * article opened right after saving showed the version from before. Calling
 * the same revalidation from here clears both.
 *
 * Owner-only, like every write: a Server Function is a public endpoint.
 */
export async function refreshPublicPages(kind: ContentKindParam, slugs: string[]) {
  await requireOwner()
  if (slugs.length === 0) revalidateContent(kind)
  for (const slug of new Set(slugs)) revalidateContent(kind, slug)
}
