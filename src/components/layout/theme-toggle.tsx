'use client'

import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/icons'
import { useIsMounted } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const ORDER = ['light', 'dark', 'system'] as const
type Mode = (typeof ORDER)[number]

const ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon }

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('common')
  const { theme, setTheme } = useTheme()
  // next-themes can't know the resolved theme until after hydration; render a
  // stable placeholder first so server and client markup agree.
  const mounted = useIsMounted()

  const mode: Mode = mounted && ORDER.includes(theme as Mode) ? (theme as Mode) : 'system'
  const Icon = ICONS[mode]
  const label = { light: t('themeLight'), dark: t('themeDark'), system: t('themeSystem') }[mode]

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length])}
      aria-label={`${t('toggleTheme')} — ${label}`}
      title={`${t('toggleTheme')} — ${label}`}
      className={cn(
        'sticker-sm sticker-hover bg-surface grid size-10 place-items-center',
        !mounted && 'opacity-0',
        className,
      )}
    >
      <Icon className="size-[1.15rem]" />
    </button>
  )
}
