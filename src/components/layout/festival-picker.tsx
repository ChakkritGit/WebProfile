'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FESTIVALS, type FestivalId } from '@/config/festivals'
import { CloseIcon } from '@/components/icons'
import { playFestival, useSceneRunning } from './festival-decor'
import { useAtFooter, useIsMounted } from '@/lib/hooks'
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
 * The control that lets anyone watch a festival out of season.
 *
 * `?festival=` has always done this; the button is for the people who would
 * never guess a query parameter existed. Pressing the same one twice plays it
 * again — see `playFestival`, where a counter does the work the URL cannot,
 * since setting a value to what it already was changes nothing.
 *
 * Client-only: it reads and writes the URL, and it has nothing to say until the
 * page it decorates is running.
 */
export function FestivalPicker() {
  const t = useTranslations('festival')
  const tName = useTranslations('festival.name')
  const mounted = useIsMounted()
  const playing = useSceneRunning()
  // The button and its chip are about 90px of the bottom-left corner, and the
  // footer has its own things to say down there.
  const atFooter = useAtFooter(92)
  const hidden = playing || atFooter
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Nothing to dismiss while a scene is on screen — the panel is not rendered
    // then, and the control cannot be reached to open one.
    if (!open || hidden) return
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
  }, [open, hidden])

  if (!mounted) return null

  const play = (id: string) => {
    playFestival(id)
    setCurrent(id)
    setOpen(false)
  }

  return (
    // It steps out of the way while a scene plays and comes back when it is over.
    // Faded rather than unmounted, so it does not pop in and out of existence and
    // it keeps whatever it was told to remember.
    <div
      ref={box}
      className={cn(
        'fixed bottom-4 left-4 z-50 transition-all duration-500 sm:bottom-6 sm:left-6',
        hidden && 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      {open && !hidden && (
        <div className="sticker bg-surface absolute bottom-full left-0 mb-3 w-52 p-2">
          <p className="font-display text-muted px-2 py-1 text-xs font-bold tracking-wide uppercase">
            {t('pick')}
          </p>
          <ul className="space-y-0.5">
            {FESTIVALS.map((festival) => (
              <li key={festival.id}>
                <button
                  type="button"
                  onClick={() => play(festival.id)}
                  className={cn(
                    'font-display flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors',
                    current === festival.id ? 'bg-brand-soft text-ink' : 'text-muted hover:text-ink hover:bg-surface-2',
                  )}
                >
                  <span
                    aria-hidden
                    className="border-line size-3.5 shrink-0 rounded-full border-2"
                    style={{ background: SWATCH[festival.id] }}
                  />
                  {tName(festival.id)}
                  {current === festival.id && (
                    <span className="text-muted ms-auto text-[0.7rem] font-normal">{t('replay')}</span>
                  )}
                </button>
              </li>
            ))}
            <li className="pt-1">
              <button
                type="button"
                onClick={() => play('')}
                className="font-display text-muted hover:text-ink hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors"
              >
                <CloseIcon aria-hidden className="size-3.5 shrink-0" />
                {t('normal')}
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t('pick')}
          className="sticker-sm sticker-hover bg-surface grid size-11 shrink-0 place-items-center"
        >
          <PaletteIcon aria-hidden className="size-5" />
        </button>

        {/* The nudge sits outside the button, where it can be read without
            hovering anything — but only where there is room for it. On a phone
            it is a chip of text sitting over the page for the sake of a control
            the palette already explains. */}
        {!open && (
          <span className="sticker-sm bg-brand-soft font-display hidden px-2.5 py-1 text-xs font-bold whitespace-nowrap sm:inline-block">
            {t('hint')}
          </span>
        )}
      </div>
    </div>
  )
}

/** A painter's palette, drawn like the rest of the set. */
function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3.2c5 0 8.9 3.4 8.9 7.6 0 2.6-2 3.6-3.6 3.6h-1.5c-1.2 0-2 .8-2 1.8 0 .5.2.9.4 1.3.3.4.4.8.4 1.2 0 1-.9 1.9-2.4 1.9-4.9 0-8.9-3.6-8.9-8.6S7 3.2 12 3.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="9.4" r="1.5" fill="currentColor" />
      <circle cx="12.4" cy="7.2" r="1.5" fill="currentColor" />
      <circle cx="16.8" cy="9.6" r="1.5" fill="currentColor" />
      <circle cx="7.6" cy="14.2" r="1.5" fill="currentColor" />
    </svg>
  )
}
