'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { GlobeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Switches language while staying on the same page. `usePathname` from
 * next-intl returns the path without the locale prefix, so the router can
 * re-render it under the other locale directly.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const t = useTranslations('common')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div
      // h-10 matches the theme toggle beside it; without it the pill rendered
      // 36px against the toggle's 40px.
      className={cn(
        'sticker-sm bg-surface flex h-10 items-center overflow-hidden p-0.5',
        className,
      )}
      role="group"
      aria-label={t('changeLanguage')}
    >
      <GlobeIcon aria-hidden className="text-muted mx-1.5 size-4 shrink-0" />
      {routing.locales.map((code) => {
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            disabled={pending}
            aria-current={active ? 'true' : undefined}
            onClick={(event) => {
              // Focus restoration on the remounted button also nudges the
              // viewport, so release it before navigating.
              event.currentTarget.blur()
              const search = typeof window === 'undefined' ? '' : window.location.search
              startTransition(() =>
                // Land at the top of the translated page. Restoring the exact
                // reading position is not achievable across languages — the
                // translations differ in length, so any offset we restore drops
                // the reader into a different section. A single predictable
                // jump beats the viewport drifting on its own.
                router.replace(`${pathname}${search}`, { locale: code, scroll: true }),
              )
            }}
            className={cn(
              'font-display grid h-full place-items-center rounded-[0.55rem] px-2.5 text-xs font-bold uppercase transition-colors',
              active ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink',
            )}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
