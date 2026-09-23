'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, usePathname } from '@/i18n/navigation'
import { navItems } from '@/config/nav'
import { profile } from '@/config/site'
import { CloseIcon, MenuIcon } from '@/components/icons'
import { Logo } from '@/components/brand/logo'
import { LocaleToggle } from './locale-toggle'
import { ThemeToggle } from './theme-toggle'
import { FestivalDecor, useFestival } from './festival-decor'
import { FestivalPicker } from './festival-picker'
import { SearchDialog } from './search-dialog'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const festival = useFestival()

  // Close the sheet whenever the route changes — including via back/forward.
  // Adjusting state during render is React's documented alternative to an
  // effect here, and avoids a wasted frame with the menu still open.
  const [menuRoute, setMenuRoute] = useState(pathname)
  if (menuRoute !== pathname) {
    setMenuRoute(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="border-line sticky top-0 z-50 border-b" style={{ height: 'var(--header-h)' }}>
      <div className="bg-paper/90 relative h-full backdrop-blur-md">
        {festival && <FestivalDecor festival={festival} />}
        <nav
          aria-label={t('menu')}
          className="relative z-10 mx-auto flex h-full max-w-6xl items-center gap-2 px-4 sm:px-6"
        >
          <Link href="/" className="group mr-auto flex items-center no-underline" aria-label={profile.brand}>
            <Logo label={profile.brand} />
          </Link>

          <ul className="mr-3 hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'font-display border-b py-1 text-[0.8rem] tracking-[0.12em] uppercase no-underline transition-colors',
                    isActive(item.href)
                      ? 'text-brand-strong border-line-strong'
                      : 'text-ink-soft hover:text-brand-strong border-transparent',
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>

          <SearchDialog />
          <FestivalPicker />
          <div className="hidden md:block">
            <LocaleToggle />
          </div>
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('close') : t('menu')}
            className="border-line grid size-10 place-items-center border md:hidden"
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="bg-paper border-line absolute inset-x-0 top-full border-b md:hidden"
          >
            <ul className="mx-auto max-w-6xl px-4 py-2">
              {navItems.map((item) => (
                <li key={item.key} className="border-line border-b">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'font-display block py-3.5 text-sm tracking-[0.12em] uppercase no-underline',
                      isActive(item.href) ? 'text-brand-strong' : 'text-ink',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li className="py-3">
                <LocaleToggle block />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
