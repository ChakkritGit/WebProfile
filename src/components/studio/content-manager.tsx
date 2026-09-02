'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { StickerCard } from '@/components/ui/sticker-card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import {
  ArrowRightIcon,
  CloseIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons'
import { formatDate } from '@/lib/utils'

export interface ManagedItem {
  id: string
  title: string
  slug: string
  locale: string
  status: 'DRAFT' | 'PUBLISHED'
  updatedAt: string
  featured: boolean
  tags: string[]
}

const PER_PAGE = 8

/**
 * Studio list for one content kind: client-side search, status/language
 * filters and pagination over a set that is small enough to ship whole.
 */
export function ContentManager({
  kind,
  items,
  locale,
  title,
  newLabel,
  newHref,
  emptyLabel,
}: {
  kind: 'posts' | 'projects'
  items: ManagedItem[]
  locale: string
  title: string
  newLabel: string
  newHref: string
  emptyLabel: string
}) {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')
  const [lang, setLang] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ManagedItem | null>(null)

  const languages = useMemo(
    () => [...new Set(items.map((i) => i.locale))].sort(),
    [items],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false
      if (lang !== 'ALL' && item.locale !== lang) return false
      if (!q) return true
      return [item.title, item.slug, ...item.tags].join(' ').toLowerCase().includes(q)
    })
  }, [items, query, status, lang])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  // Clamp rather than reset: narrowing the filter shouldn't strand an empty page.
  const current = Math.min(page, totalPages)
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  function reset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  async function call(id: string, path: string, method: string) {
    setBusyId(id)
    setError(null)
    const response = await fetch(path, { method })
    setBusyId(null)
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? tCommon('error'))
      return false
    }
    startTransition(() => router.refresh())
    return true
  }

  const statusOptions = [
    { value: 'ALL', label: t('filterAll') },
    { value: 'PUBLISHED', label: t('filterPublished') },
    { value: 'DRAFT', label: t('filterDraft') },
  ]
  const langOptions = [
    { value: 'ALL', label: t('filterAll') },
    ...languages.map((code) => ({ value: code, label: code.toUpperCase() })),
  ]

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{title}</h2>
        <ButtonLink href={newHref} size="sm">
          <PlusIcon className="size-4" />
          {newLabel}
        </ButtonLink>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_7rem]">
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="text-muted pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(event) => reset(setQuery)(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="border-line-soft bg-paper focus:border-line h-11 w-full rounded-xl border-2 ps-10 pe-10 text-sm outline-none transition-colors [&::-webkit-search-cancel-button]:hidden"
            type="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => reset(setQuery)('')}
              aria-label={t('clearSearch')}
              className="text-muted hover:text-ink absolute end-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full"
            >
              <CloseIcon className="size-3.5" />
            </button>
          )}
        </div>
        <Select
          value={status}
          onChange={(v) => reset(setStatus)(v as typeof status)}
          options={statusOptions}
          label={tCommon('published')}
        />
        <Select
          value={lang}
          onChange={reset(setLang)}
          options={langOptions}
          label={t('filterLocale')}
        />
      </div>

      {error && <p className="mb-3 text-sm text-[#e0362f]">{error}</p>}

      {visible.length === 0 ? (
        <StickerCard className="p-10 text-center">
          <p className="text-muted">
            {query ? t('noMatches', { query }) : emptyLabel}
          </p>
        </StickerCard>
      ) : (
        <>
          <ul className="space-y-3">
            {visible.map((item) => {
              const published = item.status === 'PUBLISHED'
              const busy = busyId === item.id || pending
              return (
                <li key={item.id} className="sticker bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-bold">{item.title}</p>
                      <p className="text-muted mt-0.5 truncate text-xs">
                        /{item.slug} ·{' '}
                        {tCommon('updatedOn', { date: formatDate(item.updatedAt, locale) })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{item.locale.toUpperCase()}</Badge>
                      {item.featured && <Badge tone="sun">{tCommon('featured')}</Badge>}
                      <Badge tone={published ? 'mint' : 'neutral'}>
                        {published ? tCommon('published') : tCommon('draft')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/studio/${kind}/${item.id}`}
                        aria-label={t(kind === 'posts' ? 'editPost' : 'editProject')}
                        className="sticker-sm sticker-hover bg-surface grid size-9 place-items-center"
                      >
                        <PencilIcon className="size-4" />
                      </Link>
                      <Button
                        size="sm"
                        variant={published ? 'secondary' : 'primary'}
                        disabled={busy}
                        onClick={() =>
                          void call(item.id, `/api/content/${kind}/${item.id}/publish`, 'POST')
                        }
                      >
                        <EyeIcon className="size-4" />
                        {published ? t('unpublish') : t('publish')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        aria-label={t('delete')}
                        className="px-3"
                        onClick={() => setToDelete(item)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm">
              {t('showing', {
                from: (current - 1) * PER_PAGE + 1,
                to: Math.min(current * PER_PAGE, filtered.length),
                total: filtered.length,
              })}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                >
                  <ArrowRightIcon className="size-4 rotate-180" />
                  {tCommon('previous')}
                </Button>
                <span className="font-display text-sm">
                  {tCommon('pageOf', { page: current, total: totalPages })}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={current >= totalPages}
                  onClick={() => setPage(current + 1)}
                >
                  {tCommon('next')}
                  <ArrowRightIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={t('confirmDeleteTitle')}
        description={
          toDelete ? t('confirmDeleteBody', { title: toDelete.title }) : undefined
        }
        confirmLabel={t('confirmDelete')}
        cancelLabel={t('cancel')}
        danger
        pending={busyId !== null}
        onConfirm={async () => {
          if (!toDelete) return
          const ok = await call(toDelete.id, `/api/content/${kind}/${toDelete.id}`, 'DELETE')
          if (ok) setToDelete(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </section>
  )
}
