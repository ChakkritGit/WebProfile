'use client'

import { useEffect } from 'react'

/**
 * Records a single view for the current item.
 *
 * Guarded by sessionStorage so refreshing or navigating back doesn't inflate
 * the count. The guard is written *when the request fires*, not when the effect
 * starts: React StrictMode runs the effect twice, and marking it up front meant
 * the first pass claimed the key, its cleanup cancelled the pending request, and
 * the second pass saw "already counted" and did nothing — so no view was ever
 * recorded.
 */
export function ViewTracker({
  kind,
  slug,
  locale,
}: {
  kind: 'post' | 'project'
  slug: string
  locale: string
}) {
  useEffect(() => {
    const key = `viewed:${kind}:${locale}:${slug}`
    if (sessionStorage.getItem(key)) return

    // Only count readers who actually stayed on the page.
    const timer = setTimeout(() => {
      sessionStorage.setItem(key, '1')
      void fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, slug, locale }),
        keepalive: true,
      }).catch(() => {
        // A failed count is not worth surfacing to the reader.
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [kind, slug, locale])

  return null
}
