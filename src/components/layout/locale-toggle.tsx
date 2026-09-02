'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { localeMeta, routing, type Locale } from '@/i18n/routing'
import { CheckIcon, ChevronDownIcon, GlobeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Language picker: a globe plus the current language, opening a themed list.
 *
 * A row of buttons stopped scaling once a third language arrived, and it would
 * only get worse with a fourth.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const t = useTranslations('common')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [active, setActive] = useState(() => routing.locales.indexOf(locale))
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function choose(next: Locale) {
    setOpen(false)
    if (next === locale) return
    const search = typeof window === 'undefined' ? '' : window.location.search
    startTransition(() =>
      // Land at the top of the translated page. Restoring the exact reading
      // position is not achievable across languages — the translations differ
      // in length, so any offset we restore drops the reader elsewhere.
      router.replace(`${pathname}${search}`, { locale: next, scroll: true }),
    )
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const last = routing.locales.length - 1
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) setOpen(true)
        else setActive((i) => Math.min(last, i + 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) choose(routing.locales[active])
        else setOpen(true)
        return
      case 'Escape':
        setOpen(false)
        return
      case 'Tab':
        setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('changeLanguage')}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          'sticker-sm sticker-hover bg-surface font-display flex h-10 items-center gap-1.5 px-3 text-xs font-bold',
          open && 'shadow-[1px_1px_0_0_var(--shadow)]',
        )}
      >
        <GlobeIcon aria-hidden className="text-muted size-4 shrink-0" />
        <span>{localeMeta[locale].short}</span>
        <ChevronDownIcon
          aria-hidden
          className={cn('text-muted size-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('changeLanguage')}
          className="sticker bg-surface absolute end-0 z-50 mt-2 w-44 p-1.5"
        >
          {routing.locales.map((code, index) => {
            const selected = code === locale
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(code)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                    index === active ? 'bg-brand-soft' : 'hover:bg-surface-2',
                  )}
                >
                  <span className="font-display text-muted w-7 shrink-0 text-xs font-bold">
                    {localeMeta[code].short}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{localeMeta[code].label}</span>
                  {selected && <CheckIcon aria-hidden className="text-brand size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
