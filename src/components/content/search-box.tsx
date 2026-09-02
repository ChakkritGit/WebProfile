'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { CloseIcon, SearchIcon } from '@/components/icons'
import { buildQuery } from '@/lib/search'
import { pinScroll } from '@/lib/pin-scroll'
import { cn } from '@/lib/utils'

/**
 * Search input that writes to the URL so every result set is shareable.
 *
 * The field owns its text outright and is never re-seeded from the URL while
 * the reader is typing — an earlier version synced state back from the query on
 * every render, which meant each keystroke was immediately overwritten by the
 * value the previous keystroke had just pushed. Back/forward is handled through
 * `popstate` instead, which cannot fire mid-keystroke.
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
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Only history navigation may replace what the reader has typed.
    const onPopState = () => {
      const next = new URLSearchParams(window.location.search).get('q') ?? ''
      setValue(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function apply(next: string) {
    pinScroll()
    // Dropping `page` is essential: page 3 of a new query is usually empty.
    startTransition(() =>
      router.replace(`${pathname}${buildQuery({ q: next, tag })}`, { scroll: false }),
    )
  }

  function onChange(next: string) {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => apply(next), 400)
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
        ref={inputRef}
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
            inputRef.current?.focus()
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
