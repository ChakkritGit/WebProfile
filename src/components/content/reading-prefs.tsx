'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { PencilIcon, TextSizeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** The sizes the control steps through, as a multiplier on the article body. */
export const READING_STEPS = [0.9, 1, 1.15, 1.32]
const DEFAULT_STEP = 1
const SCALE_KEY = 'reading-scale'
const FONT_KEY = 'reading-font'

/* ---------------------------- stored settings ---------------------------- */

const listeners = new Set<() => void>()

function subscribe(notify: () => void) {
  listeners.add(notify)
  // `storage` only fires in *other* tabs, which is exactly what it is for here:
  // a reader who changes the size in one tab sees it in the rest.
  window.addEventListener('storage', notify)
  return () => {
    listeners.delete(notify)
    window.removeEventListener('storage', notify)
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private-mode Safari throws on write. The setting still applies to this
    // page; it just will not survive a reload, which beats crashing the control.
  }
  listeners.forEach((notify) => notify())
}

/**
 * A setting the reader stored, read without a hydration mismatch.
 *
 * `useSyncExternalStore` rather than an effect that calls `setState`: the server
 * snapshot is the default and the client's is whatever is in storage, and React
 * swaps them at hydration itself. The effect version had to render once with the
 * default and then set state — a wasted render for every reader, and the exact
 * shape `react-hooks/set-state-in-effect` exists to catch.
 */
function useStored<T>(read: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, read, () => fallback)
}

/* ------------------------------- the cards ------------------------------- */

/**
 * Text size for the article body, saved per reader.
 *
 * The chosen multiplier lands on a custom property at the root and only
 * `.article-body` reads it, so the size of the page around the article never
 * moves. `ReadingPrefsScript` applies the same value before hydration, so the
 * article does not render at 100% and then jump.
 */
export function ReadingSize({ className }: { className?: string }) {
  const t = useTranslations('common')
  const step = useStored(readStep, DEFAULT_STEP)

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-scale', String(READING_STEPS[step]))
  }, [step])

  const move = (by: number) => {
    write(SCALE_KEY, String(Math.min(READING_STEPS.length - 1, Math.max(0, step + by))))
  }

  const button = (delta: number, label: string, size: string, disabled: boolean) => (
    <button
      type="button"
      onClick={() => move(delta)}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'sticker-sm bg-surface font-display grid size-9 shrink-0 place-items-center leading-none font-bold',
        size,
        disabled ? 'opacity-35' : 'sticker-hover',
      )}
    >
      A
    </button>
  )

  return (
    <div className={cn('sticker bg-surface p-4', className)}>
      <p className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
        <TextSizeIcon className="size-4" />
        {t('textSize')}
      </p>

      <div className="flex items-center gap-3">
        {button(-1, t('textSizeSmaller'), 'text-xs', step === 0)}

        <div aria-hidden className="flex flex-1 items-end justify-center gap-1.5">
          {READING_STEPS.map((_, i) => (
            <span
              key={i}
              style={{ height: 6 + i * 3 }}
              className={cn(
                'w-1.5 rounded-full transition-colors',
                i <= step ? 'bg-brand' : 'bg-[var(--line-soft)]',
              )}
            />
          ))}
        </div>

        {button(1, t('textSizeLarger'), 'text-lg', step === READING_STEPS.length - 1)}
      </div>

      <p aria-live="polite" className="sr-only">
        {t('textSizeCurrent', { percent: Math.round(READING_STEPS[step] * 100) })}
      </p>
    </div>
  )
}

function readStep(): number {
  const saved = localStorage.getItem(SCALE_KEY)
  // `Number(null)` is 0, which is a valid index — without this guard every
  // first-time reader would land on the smallest size.
  if (saved === null) return DEFAULT_STEP
  const index = Number(saved)
  const valid = Number.isInteger(index) && index >= 0 && index < READING_STEPS.length
  return valid ? index : DEFAULT_STEP
}

/**
 * The face the article is set in.
 *
 * The site is handwritten throughout and that is the point of it, but a whole
 * article in a hand is harder going than a page of chrome, so the reader gets a
 * way out. Each option is shown in the face it selects — the only useful preview
 * of a typeface is the typeface.
 */
export function ReadingFont({ className }: { className?: string }) {
  const t = useTranslations('common')
  const plain = useStored(() => localStorage.getItem(FONT_KEY) === 'plain', false)

  useEffect(() => {
    const root = document.documentElement.style
    if (plain) root.setProperty('--reading-font', 'var(--font-plain)')
    else root.removeProperty('--reading-font')
  }, [plain])

  const option = (isPlain: boolean, label: string, font: string) => (
    <button
      type="button"
      onClick={() => write(FONT_KEY, isPlain ? 'plain' : 'hand')}
      aria-pressed={plain === isPlain}
      style={{ fontFamily: font }}
      className={cn(
        'flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors',
        plain === isPlain ? 'bg-brand-soft text-ink' : 'text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className={cn('sticker bg-surface p-4', className)}>
      <p className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
        <PencilIcon className="size-4" />
        {t('font')}
      </p>
      <div className="border-line flex gap-1 rounded-xl border-2 p-1">
        {option(false, t('fontHand'), 'var(--font-sans)')}
        {option(true, t('fontPlain'), 'var(--font-plain)')}
      </div>
    </div>
  )
}

/**
 * Applies the saved preferences before the first paint.
 *
 * Without this the article renders at 100% in the handwriting and then jumps once
 * hydration runs, which is exactly the flash the reader changed the setting to
 * avoid. Inline and synchronous, the way a theme script has to be — and silent on
 * failure, because storage throws in private-mode Safari and a missing preference
 * is not worth an error.
 */
export function ReadingPrefsScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `try{var d=document.documentElement.style,` +
          `i=localStorage.getItem('${SCALE_KEY}'),s=${JSON.stringify(READING_STEPS)};` +
          `if(i!==null&&s[i])d.setProperty('--reading-scale',s[i]);` +
          `if(localStorage.getItem('${FONT_KEY}')==='plain')d.setProperty('--reading-font','var(--font-plain)')` +
          `}catch(e){}`,
      }}
    />
  )
}
