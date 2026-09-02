'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { CloseIcon, SearchIcon } from '@/components/icons'
import { buildQuery } from '@/lib/search'
import { cn } from '@/lib/utils'

/**
 * Search input that writes to the URL so every result set is shareable and
 * back/forward works. Typing is debounced; submitting applies immediately.
 */
export function SearchBox({
  initialQuery = '',
  tag,
  className,
}: {
  initialQuery?: string
  tag?: string
  className?: string
}) {
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initialQuery)
  // Last value this component pushed to the URL. Comparing against it lets us
  // tell "the URL changed because of us" from "the URL changed elsewhere".
  const [applied, setApplied] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A tag chip, a back button or a plain link changed the query: adopt it.
  // Adjusting state during render (rather than in an effect) avoids rendering
  // one frame with the stale term. Typing is unaffected because `applied`
  // already matches whatever we pushed.
  if (initialQuery !== applied) {
    setApplied(initialQuery)
    setValue(initialQuery)
  }

  function apply(next: string) {
    if (next === applied) return
    setApplied(next)
    // Dropping `page` is essential: page 3 of a new query is usually empty.
    startTransition(() => router.replace(`${pathname}${buildQuery({ q: next, tag })}`))
  }

  function onChange(next: string) {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => apply(next), 350)
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        if (timer.current) clearTimeout(timer.current)
        apply(value)
      }}
      className={cn('relative', className)}
    >
      <SearchIcon
        aria-hidden
        className="text-muted pointer-events-none absolute start-4 top-1/2 size-[1.15rem] -translate-y-1/2"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
        className={cn(
          'sticker-sm bg-surface h-12 w-full ps-12 pe-11 text-base outline-none',
          'placeholder:text-muted/75 focus:shadow-[4px_4px_0_0_var(--shadow)]',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('')
            if (timer.current) clearTimeout(timer.current)
            apply('')
          }}
          aria-label={t('searchClear')}
          className="text-muted hover:text-ink absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </form>
  )
}
