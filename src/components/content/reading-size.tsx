'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TextSizeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** The sizes the control steps through, as a multiplier on the article body. */
export const READING_STEPS = [0.9, 1, 1.15, 1.32]
const DEFAULT_STEP = 1
const STORAGE_KEY = 'reading-scale'

/**
 * Text size for the article body, saved per reader.
 *
 * The chosen multiplier lands on a custom property at the root and only
 * `.article-body` reads it, so the size of the page around the article never
 * moves. It is applied from an effect and never during render: the server has no
 * way to know what the reader picked last time, and reading storage while
 * rendering would be a hydration mismatch. `ReadingSizeScript` covers the gap
 * before hydration.
 */
export function ReadingSize({ className }: { className?: string }) {
  const t = useTranslations('common')
  const [step, setStep] = useState(DEFAULT_STEP)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return
    const index = Number(saved)
    // `Number(null)` is 0, which is a valid index — hence the null check above,
    // or every first-time reader would land on the smallest size.
    if (Number.isInteger(index) && index >= 0 && index < READING_STEPS.length) setStep(index)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-scale', String(READING_STEPS[step]))
  }, [step])

  const move = useCallback((by: number) => {
    setStep((current) => {
      const next = Math.min(READING_STEPS.length - 1, Math.max(0, current + by))
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

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

/**
 * Applies the saved size before the first paint.
 *
 * Without this the article renders at 100% and then jumps once hydration runs,
 * which is exactly the flash the reader changed the setting to avoid. Inline and
 * synchronous, the way a theme script has to be — and silent on failure, because
 * storage throws in private-mode Safari and a missing preference is not worth an
 * error.
 */
export function ReadingSizeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var i=localStorage.getItem('${STORAGE_KEY}'),s=${JSON.stringify(READING_STEPS)};if(i!==null&&s[i])document.documentElement.style.setProperty('--reading-scale',s[i])}catch(e){}`,
      }}
    />
  )
}
