'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'posts', href: '/studio' },
  { key: 'projects', href: '/studio?tab=projects' },
] as const

export function StudioTabs({ className }: { className?: string }) {
  const t = useTranslations('studio')
  const pathname = usePathname()
  const inStudioRoot = pathname === '/studio'

  return (
    <nav className={cn('flex flex-wrap gap-2', className)}>
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            'font-display rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all',
            inStudioRoot
              ? 'border-line bg-surface shadow-[2px_2px_0_0_var(--shadow)]'
              : 'border-line-soft text-muted hover:border-line hover:text-ink',
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  )
}
