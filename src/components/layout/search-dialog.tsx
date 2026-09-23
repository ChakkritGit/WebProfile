'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CornerDownLeft, FileText, FolderGit2 } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { SearchIcon } from '@/components/icons'
import { matchesQuery, type SearchEntry } from '@/lib/search'
import { useScrollLock } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/** How many hits the dialog shows before handing over to `/search`. */
const PREVIEW = 6

/**
 * The navbar's search: a button that opens a dialog, results as you type, and
 * Enter for the full page at `/search?q=`.
 *
 * A native `<dialog>` with `showModal()` — focus trapping, Escape, the inert page
 * behind it and the backdrop all come from the platform. `⌘K` / `Ctrl K` opens
 * it from anywhere.
 */
export function SearchDialog() {
  const t = useTranslations('search')
  const locale = useLocale()
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchEntry[] | null>(null)
  useScrollLock(open)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        show()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fetched on first open, not on page load: most visits never search.
  useEffect(() => {
    if (!open || index) return
    let live = true
    fetch(`/api/search?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: SearchEntry[]) => live && setIndex(rows))
      .catch(() => live && setIndex([]))
    return () => {
      live = false
    }
  }, [open, index, locale])

  function show() {
    dialog.current?.showModal()
    setOpen(true)
  }

  function hide() {
    dialog.current?.close()
  }

  const q = query.trim()
  const hits = q && index ? index.filter((entry) => matchesQuery(entry, q)) : []

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={t('open')}
        title={`${t('open')} (⌘K)`}
        className="hover:text-brand-strong grid size-10 place-items-center transition-colors"
      >
        <SearchIcon aria-hidden className="size-[1.15rem]" strokeWidth={1.75} />
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => event.target === dialog.current && hide()}
        aria-label={t('open')}
        className="bg-surface text-ink border-line-strong m-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] max-w-none border p-0 backdrop:bg-[#050510]/60 backdrop:backdrop-blur-sm"
      >
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            if (!q) return
            hide()
            router.push(`/search?q=${encodeURIComponent(q)}`)
          }}
          className="border-line relative border-b"
        >
          <SearchIcon
            aria-hidden
            className="text-brand-strong pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
          />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            className="h-14 w-full bg-transparent ps-12 pe-4 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
          />
        </form>

        <div className="max-h-[55vh] overflow-y-auto">
          {!q && <p className="text-muted px-4 py-6 text-sm">{t('hint')}</p>}
          {q && index && hits.length === 0 && (
            <p className="text-muted px-4 py-6 text-sm">{t('noResults', { query: q })}</p>
          )}
          {hits.length > 0 && (
            <ul>
              {hits.slice(0, PREVIEW).map((hit) => {
                const Icon = hit.kind === 'post' ? FileText : FolderGit2
                return (
                  <li key={hit.href} className="border-line border-b last:border-b-0">
                    <Link
                      href={hit.href}
                      onClick={hide}
                      className="hover:bg-brand-soft focus-visible:bg-brand-soft group flex items-start gap-3 px-4 py-3 no-underline outline-none"
                    >
                      <Icon aria-hidden className="text-brand-strong mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{hit.title}</span>
                        {hit.summary && (
                          <span className="text-muted mt-0.5 block truncate text-sm">{hit.summary}</span>
                        )}
                      </span>
                      <span className="label-mono text-muted shrink-0">
                        {t(hit.kind === 'post' ? 'article' : 'project')}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          className={cn(
            'border-line text-muted flex items-center justify-between gap-3 border-t px-4 py-2.5',
            'font-mono text-[0.7rem] uppercase',
          )}
        >
          <span>{q && index ? t('count', { count: hits.length }) : 'esc'}</span>
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft aria-hidden className="size-3.5" />
            {t('seeAll')}
          </span>
        </div>
      </dialog>
    </>
  )
}
