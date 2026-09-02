'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDownIcon, CheckIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

/**
 * Themed listbox replacing the native <select>, which cannot be styled to match
 * the sticker language and renders an OS-coloured popup in dark mode.
 *
 * Implements the ARIA listbox keyboard contract: arrows move the active option,
 * Enter/Space commit, Esc closes, Home/End jump, and typing jumps to a match.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  className,
  id,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  className?: string
  id?: string
}) {
  const t = useTranslations('studio')
  const generatedId = useId()
  const listId = `${id ?? generatedId}-listbox`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)))
  const rootRef = useRef<HTMLDivElement>(null)
  const typed = useRef({ text: '', at: 0 })

  const selected = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [open])

  function commit(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          return
        }
        setActive((i) => (event.key === 'ArrowDown' ? Math.min(last, i + 1) : Math.max(0, i - 1)))
        return
      }
      case 'Home':
        if (open) { event.preventDefault(); setActive(0) }
        return
      case 'End':
        if (open) { event.preventDefault(); setActive(last) }
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) commit(active)
        else setOpen(true)
        return
      case 'Escape':
        if (open) { event.preventDefault(); setOpen(false) }
        return
      case 'Tab':
        setOpen(false)
        return
      default: {
        if (event.key.length !== 1) return
        // Type-ahead: consecutive keystrokes within a second build a prefix.
        const now = Date.now()
        typed.current.text = now - typed.current.at > 1000 ? event.key : typed.current.text + event.key
        typed.current.at = now
        const match = options.findIndex((o) =>
          o.label.toLowerCase().startsWith(typed.current.text.toLowerCase()),
        )
        if (match >= 0) {
          setActive(match)
          if (!open) commit(match)
        }
      }
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          'border-line-soft bg-paper flex h-11 w-full items-center gap-2 rounded-xl border-2 px-3.5 text-start text-sm',
          'transition-colors outline-none focus-visible:border-[var(--line)]',
          open && 'border-line',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDownIcon
          aria-hidden
          className={cn('text-muted size-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="sticker bg-surface absolute z-30 mt-2 max-h-64 w-full overflow-auto p-1.5"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                    index === active ? 'bg-brand-soft' : 'hover:bg-surface-2',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.hint && (
                      <span className="text-muted block truncate text-xs">{option.hint}</span>
                    )}
                  </span>
                  {isSelected && <CheckIcon aria-hidden className="text-brand size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <span className="sr-only">{t('selectOpen')}</span>
    </div>
  )
}
