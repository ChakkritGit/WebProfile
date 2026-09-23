'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PartyPopper } from 'lucide-react'
import { FESTIVALS, type FestivalId } from '@/config/festivals'
import { CloseIcon } from '@/components/icons'
import { playFestival } from './festival-decor'
import { cn } from '@/lib/utils'

/** A dab of each festival's colour, so the list reads at a glance. */
const SWATCH: Record<FestivalId, string> = {
  'new-year': '#ffd166',
  valentine: '#ff5a6e',
  songkran: '#f2c53d',
  'loy-krathong': '#f9b8ce',
  halloween: '#7c5cff',
  christmas: '#2f9e6b',
}

/**
 * The navbar control that dresses the header for any festival, out of season.
 *
 * `?festival=` has always done this; the button is for the people who would
 * never guess a query parameter existed.
 */
export function FestivalPicker() {
  const t = useTranslations('festival')
  const tName = useTranslations('festival.name')
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    const esc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    // `pointerdown` rather than `click`: on a phone a tap that starts outside and
    // ends on the panel would otherwise never close it.
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const play = (id: string) => {
    playFestival(id)
    setCurrent(id)
    setOpen(false)
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('pick')}
        title={t('pick')}
        className="hover:text-brand-strong grid size-10 place-items-center transition-colors"
      >
        <PartyPopper aria-hidden className="size-[1.15rem]" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="bg-surface border-line absolute top-full right-0 z-50 mt-2 w-56 border p-1.5">
          <p className="label-mono text-muted px-2 py-1.5">{t('pick')}</p>
          <ul>
            {FESTIVALS.map((festival) => (
              <li key={festival.id}>
                <button
                  type="button"
                  onClick={() => play(festival.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-2 py-2 text-left text-sm transition-colors',
                    current === festival.id
                      ? 'bg-brand text-brand-ink'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0"
                    style={{ background: SWATCH[festival.id] }}
                  />
                  {tName(festival.id)}
                  {current === festival.id && (
                    <span className="ms-auto font-mono text-[0.65rem] uppercase">{t('replay')}</span>
                  )}
                </button>
              </li>
            ))}
            <li className="border-line mt-1 border-t pt-1">
              <button
                type="button"
                onClick={() => play('')}
                className="text-muted hover:text-ink hover:bg-surface-2 flex w-full items-center gap-2.5 px-2 py-2 text-left text-sm transition-colors"
              >
                <CloseIcon aria-hidden className="size-3.5 shrink-0" />
                {t('normal')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
