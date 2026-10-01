'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { EyeIcon } from '@/components/icons'

/**
 * The view count, kept current in the browser.
 *
 * The page HTML is cached for a day, so `initial` may be yesterday's number.
 * The first view this session POSTs (which counts it) and takes the number the
 * API answers with; later loads in the same session GET the current number.
 * Any failure keeps `initial`, never an error or a blank.
 *
 * `locale` is the record's own locale, not the interface one: a Thai article
 * read at `/ja/...` must count against the Thai row, since `/api/views` matches
 * on (slug, locale).
 *
 * Guarded by sessionStorage so refreshing or navigating back doesn't inflate
 * the count. The guard is written *when the request fires*, not when the effect
 * starts: React StrictMode runs the effect twice, and marking it up front meant
 * the first pass claimed the key, its cleanup cancelled the pending request, and
 * the second pass saw "already counted" and did nothing - so no view was ever
 * recorded.
 */
export function ViewCount({
  kind,
  slug,
  locale,
  initial,
}: {
  kind: 'post' | 'project'
  slug: string
  locale: string
  initial: number
}) {
  const t = useTranslations('common')
  const [views, setViews] = useState(initial)

  useEffect(() => {
    const key = `viewed:${kind}:${locale}:${slug}`
    const show = (res: Response) =>
      res
        .json()
        .then((data: { views?: number | null }) => {
          if (typeof data.views === 'number') setViews(data.views)
        })
    // A failed request is not worth surfacing to the reader.
    const ignore = () => {}

    if (sessionStorage.getItem(key)) {
      const params = new URLSearchParams({ kind, slug, locale })
      fetch(`/api/views?${params}`).then(show).catch(ignore)
      return
    }

    // Only count readers who actually stayed on the page.
    const timer = setTimeout(() => {
      sessionStorage.setItem(key, '1')
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, slug, locale }),
        keepalive: true,
      })
        .then(show)
        .catch(ignore)
    }, 1500)

    return () => clearTimeout(timer)
  }, [kind, slug, locale])

  return (
    <span className="inline-flex items-center gap-1.5">
      <EyeIcon className="size-4" />
      {t('views', { count: views })}
    </span>
  )
}
