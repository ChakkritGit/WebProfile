'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CloseIcon, PlusIcon, TagIcon } from '@/components/icons'
import { SkeletonChips } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Tag input backed by a shared vocabulary.
 *
 * Replaces the old comma-separated text field, which silently created a new tag
 * on every typo. Suggestions come from `/api/tags`; typing a name that does not
 * exist offers to add it to the master list so the next form sees it too.
 */
export function TagPicker({
  value,
  onChange,
  label,
}: {
  value: string[]
  onChange: (next: string[]) => void
  label?: string
}) {
  const t = useTranslations('studio')
  const [master, setMaster] = useState<string[] | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/tags')
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((data: { tags?: string[] }) => {
        if (!cancelled) setMaster(data.tags ?? [])
      })
      .catch(() => {
        if (!cancelled) setMaster([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = (master ?? []).filter((tag) => !value.includes(tag))
    if (!q) return pool.slice(0, 40)
    return pool.filter((tag) => tag.toLowerCase().includes(q)).slice(0, 40)
  }, [master, query, value])

  const trimmed = query.trim()
  const canCreate =
    trimmed.length > 0 &&
    !value.some((v) => v.toLowerCase() === trimmed.toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase())

  function add(tag: string) {
    const name = tag.trim()
    if (!name || value.includes(name)) return
    onChange([...value, name])
    setQuery('')
    setActive(0)
    inputRef.current?.focus()

    // Register unseen names centrally so other forms can reuse them. A failure
    // here is not worth blocking the edit — the tag is already on the record.
    if (!(master ?? []).includes(name)) {
      setMaster((m) => (m ? [...m, name].sort((a, b) => a.localeCompare(b)) : m))
      void fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).catch(() => {})
    }
  }

  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag))
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const options = canCreate ? [...suggestions, '__create'] : suggestions
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setOpen(true)
        setActive((i) => Math.min(options.length - 1, i + 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        return
      case 'Enter': {
        event.preventDefault()
        const picked = options[active]
        if (picked === '__create' || (!picked && canCreate)) add(trimmed)
        else if (picked) add(picked)
        return
      }
      case 'Escape':
        setOpen(false)
        return
      case 'Backspace':
        if (query === '' && value.length > 0) remove(value[value.length - 1])
        return
    }
  }

  if (master === null) {
    return (
      <div className="border-line-soft bg-paper rounded-xl border-2 p-3">
        <SkeletonChips count={5} label={t('tagsLoading')} />
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'border-line-soft bg-paper focus-within:border-line flex flex-wrap items-center gap-1.5 rounded-xl border-2 p-2 transition-colors',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="border-line bg-surface-2 font-display inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                remove(tag)
              }}
              aria-label={t('tagsRemove', { name: tag })}
              className="text-muted hover:text-ink"
            >
              <CloseIcon className="size-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={master === null ? t('tagsLoading') : t('tagsPlaceholder')}
          aria-label={label ?? t('tagsLabel')}
          className="text-ink min-w-[9rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
        />
      </div>

      <p className="text-muted mt-1 text-xs">{t('tagsHint')}</p>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul
          role="listbox"
          className="sticker bg-surface absolute z-30 mt-2 max-h-56 w-full overflow-auto p-1.5"
        >
          {suggestions.map((tag, i) => (
            <li key={tag}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => add(tag)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm',
                  i === active ? 'bg-brand-soft' : 'hover:bg-surface-2',
                )}
              >
                <TagIcon aria-hidden className="text-muted size-3.5 shrink-0" />
                {tag}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={active === suggestions.length}
                onMouseEnter={() => setActive(suggestions.length)}
                onClick={() => add(trimmed)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm font-semibold',
                  active === suggestions.length ? 'bg-brand-soft' : 'hover:bg-surface-2',
                )}
              >
                <PlusIcon aria-hidden className="text-brand size-3.5 shrink-0" />
                {t('tagsAdd', { name: trimmed })}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
