'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, usePathname } from '@/i18n/navigation'
import { navItems } from '@/config/nav'
import { profile } from '@/config/site'
import { CloseIcon, MenuIcon } from '@/components/icons'
import { Logo } from '@/components/brand/logo'
import { LocaleToggle } from './locale-toggle'
import { ThemeToggle } from './theme-toggle'
import { useScrolledPast } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolledPast(8)
  const reduce = useReducedMotion()

  // Close the sheet whenever the route changes — including via back/forward.
  // Adjusting state during render is React's documented alternative to an
  // effect here, and avoids a wasted frame with the menu still open.
  const [menuRoute, setMenuRoute] = useState(pathname)
  if (menuRoute !== pathname) {
    setMenuRoute(pathname)
    setOpen(false)
  }

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const listRef = useRef<HTMLUListElement>(null)
  const [pill, setPill] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const measurePill = useCallback(() => {
    const active = listRef.current?.querySelector<HTMLElement>('a[aria-current="page"]')
    // The link's own box, all four numbers. Stretching the pill to the list's
    // height instead made it 24px tall against a 37px link — the list is shorter
    // than the links it holds.
    setPill(
      active
        ? {
            x: active.offsetLeft,
            y: active.offsetTop,
            width: active.offsetWidth,
            height: active.offsetHeight,
          }
        : null,
    )
  }, [])

  // Layout effect so the pill is already in place on the first paint of a new
  // route; the label widths change with the language, hence the resize listener.
  useLayoutEffect(measurePill, [measurePill, pathname, t])
  useEffect(() => {
    window.addEventListener('resize', measurePill)
    void document.fonts?.ready.then(measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [measurePill])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-shadow duration-300',
        // A drawn rule rather than a hairline shadow, so the header's edge belongs
        // to the same hand as everything below it.
        scrolled && 'drawn-rule',
      )}
      style={{ height: 'var(--header-h)' }}
    >
      <div className="bg-paper/85 h-full backdrop-blur-md">
        <nav
          aria-label={t('menu')}
          className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 sm:px-6"
        >
          <Link href="/" className="group mr-auto flex items-center" aria-label={profile.brand}>
            <Logo label={profile.brand} className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </Link>

          <ul ref={listRef} className="relative hidden items-center gap-1 md:flex">
            {/* One pill, positioned from the active link's own measurements.
                A `layoutId` shared element read its position from the document, so
                the page's scroll counted as movement: leaving a listing scrolled
                1200px down for an article made the pill fly up from off-screen.
                Measuring inside the list removes scroll from the equation, and
                `initial={false}` means a fresh page renders it already in place. */}
            {pill && (
              <motion.span
                aria-hidden
                className="bg-brand-soft border-line absolute top-0 left-0 -z-10 rounded-full border-2"
                initial={false}
                animate={{ x: pill.x, y: pill.y, width: pill.width, height: pill.height }}
                transition={
                  reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }
                }
              />
            )}
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'font-display relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                    isActive(item.href) ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <LocaleToggle />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('close') : t('menu')}
              className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
            >
              {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-paper/98 drawn-rule-top absolute inset-x-0 top-full backdrop-blur-xl md:hidden"
          >
            <ul className="mx-auto max-w-6xl space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'font-display block rounded-2xl px-4 py-3 text-base font-semibold transition-colors',
                      isActive(item.href)
                        ? 'bg-brand-soft border-line border-2'
                        : 'hover:bg-surface-2',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <LocaleToggle block />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
