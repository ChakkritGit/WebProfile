'use client'

import { useTranslations } from 'next-intl'
import { PinLink } from '@/components/content/pin-link'
import { cn } from '@/lib/utils'

export type StudioTab = 'posts' | 'projects'

/**
 * Switches the dashboard between the two content kinds. The active tab is
 * driven by `?tab=` and passed down from the page, so the state lives in the
 * URL and stays shareable.
 */
export function StudioTabs({
  active,
  counts,
  className,
}: {
  active: StudioTab
  counts: Record<StudioTab, number>
  className?: string
}) {
  const t = useTranslations('studio')
  const tabs: StudioTab[] = ['posts', 'projects']

  return (
    <nav className={cn('flex flex-wrap gap-2', className)} aria-label={t('title')}>
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <PinLink
            key={tab}
            href={tab === 'posts' ? '/studio' : `/studio?tab=${tab}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'font-display inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all',
              isActive
                ? 'border-line bg-brand text-brand-ink shadow-[2px_2px_0_0_var(--shadow)]'
                : 'border-line-soft text-muted hover:border-line hover:text-ink',
            )}
          >
            {t(tab)}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                isActive ? 'bg-brand-ink/20' : 'bg-surface-2',
              )}
            >
              {counts[tab]}
            </span>
          </PinLink>
        )
      })}
    </nav>
  )
}
