'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/routing'
import { PROGRAMS } from '@/lib/programs'
import { ArrowRightIcon, CloseIcon, ExternalLinkIcon, SearchIcon, StatusIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PER_PAGE = 4

/** The apps I run, as a searchable, paged table; every row opens the app in a new tab. */
export function ProgramList() {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PROGRAMS
    return PROGRAMS.filter((p) =>
      [p.name[locale], p.name.en, p.about[locale], p.url.replace('https://', ''), ...p.stack].some((s) => s.toLowerCase().includes(q)),
    )
  }, [query, locale])
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE))
  const current = Math.min(page, pages)
  const shown = found.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const pageButton = 'font-display grid h-10 min-w-10 place-items-center rounded-xl border-2 px-3 text-sm font-semibold transition-all'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div role="search" className="relative w-full max-w-md">
          <SearchIcon aria-hidden className="text-muted pointer-events-none absolute start-4 top-1/2 size-[1.15rem] -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={t('programsSearch')}
            aria-label={t('programsSearch')}
            className={cn(
              'border-line bg-surface focus:border-line-strong h-12 w-full border ps-12 pe-11 text-base outline-none transition-colors',
              'placeholder:text-muted/75 [&::-webkit-search-cancel-button]:hidden',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setPage(1)
              }}
              aria-label={tc('searchClear')}
              className="text-muted hover:text-ink absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center transition-colors"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
        </div>
        <p aria-live="polite" className="text-muted font-mono text-xs uppercase">
          {t('programsCount', { count: found.length })}
        </p>
      </div>

      <div className="border-line overflow-x-auto border">
        <table className="w-full border-collapse text-start">
          <thead className="bg-surface-2 text-muted font-mono text-xs uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('programsApp')}</th>
              <th scope="col" className="hidden px-4 py-3 text-start font-semibold md:table-cell">{t('programsAbout')}</th>
              <th scope="col" className="hidden px-4 py-3 text-start font-semibold lg:table-cell">{t('programsStack')}</th>
              <th scope="col" className="px-4 py-3 text-end font-semibold">
                <span className="sr-only">{t('programsOpen')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-line group hover:bg-surface border-t transition-colors">
                <td className="px-4 py-4 align-middle">
                  <a href={p.url} target="_blank" rel="noopener" className="flex items-center gap-3">
                    {p.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 192px app icons from public/, shown at 44px
                      <img src={p.icon} alt="" width={44} height={44} className="size-11 shrink-0 rounded-[11px]" />
                    ) : (
                      <span aria-hidden className="bg-ink text-paper grid size-11 shrink-0 place-items-center rounded-[11px]">
                        <StatusIcon className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="font-display group-hover:text-brand-strong block font-semibold transition-colors">{p.name[locale]}</span>
                      <span className="text-muted block font-mono text-xs">{p.url.replace('https://', '')}</span>
                      <span className="text-ink-soft mt-1 block text-sm md:hidden">{p.about[locale]}</span>
                    </span>
                  </a>
                </td>
                <td className="text-ink-soft hidden px-4 py-4 align-middle text-sm md:table-cell">{p.about[locale]}</td>
                <td className="hidden px-4 py-4 align-middle lg:table-cell">
                  <span className="flex flex-wrap gap-1.5">
                    {p.stack.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </span>
                </td>
                <td className="px-4 py-4 text-end align-middle">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${t('programsOpen')} ${p.name[locale]}`}
                    className="border-line bg-surface sticker-hover inline-grid size-10 place-items-center rounded-xl border-2"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr className="border-line border-t">
                <td colSpan={4} className="text-muted px-4 py-10 text-center">
                  {t('programsEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label={tc('pageOf', { page: current, total: pages })} className="mt-6">
          <ul className="flex flex-wrap items-center justify-center gap-2">
            <li>
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                className={cn(pageButton, current === 1 ? 'border-line-soft text-muted/50' : 'border-line bg-surface sticker-hover')}
              >
                <ArrowRightIcon className="size-4 rotate-180" />
                <span className="sr-only">{tc('previous')}</span>
              </button>
            </li>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={tc('goToPage', { page: n })}
                  aria-current={n === current ? 'page' : undefined}
                  className={cn(
                    pageButton,
                    n === current ? 'border-line bg-brand text-brand-ink' : 'border-line-soft text-muted hover:border-line hover:text-ink',
                  )}
                >
                  {n}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                className={cn(pageButton, current === pages ? 'border-line-soft text-muted/50' : 'border-line bg-surface sticker-hover')}
              >
                <span className="sr-only">{tc('next')}</span>
                <ArrowRightIcon className="size-4" />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
