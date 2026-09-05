'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-shim'
import { Link, usePathname } from '@/i18n/navigation'
import { navItems } from '@/config/nav'
import { profile } from '@/config/site'
import { CloseIcon, MenuIcon } from '@/components/icons'
import { Logo } from '@/components/brand/logo'
import { LocaleToggle } from './locale-toggle'
import { ThemeToggle } from './theme-toggle'
import { FestivalDecor, FestivalGreeting, useFestival, useFestivalPlayKey } from './festival-decor'
import { useScrolledPast } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolledPast(8)
  const reduce = useReducedMotion()
  const festival = useFestival()
  // The scene in the middle of the screen belongs to the front page. Anywhere
  // else it would land on top of whatever the reader came to read, so those pages
  // get the dressed header and nothing more.
  const playKey = useFestivalPlayKey()
  const atHome = pathname === '/'

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


  return (
    <>
      {/* The picker goes with it: a control for a system that does nothing
          is a control that lies about what it does. */}
      {atHome && festival && <FestivalGreeting key={playKey} festival={festival} />}
      <header
        className={cn(
          'sticky top-0 z-50 transition-shadow duration-300',
          // A drawn rule rather than a hairline shadow, so the header's edge belongs
          // to the same hand as everything below it — but not while the menu is
          // open, because the panel draws its own rule at exactly this boundary and
          // the two stacked into a double line.
          scrolled && !open && 'drawn-rule',
        )}
      >
        <div className="bg-paper/85 border-line relative h-full border-b-2 backdrop-blur-md">
          {festival && <FestivalDecor festival={festival} />}
          <nav
            aria-label={t('menu')}
            /* A real height rather than `h-full`. The bar had nothing to be full of —
                 the header sets no height, so it collapsed onto the tallest control and
                 left two pixels above the language and theme buttons, which read as the
                 page starting at the very top edge. A browser chrome of this period was
                 a chunky ruled band, so it gets one. */
              className="relative z-10 mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6"
          >
            <Link href="/" className="group mr-auto flex items-center" aria-label={profile.brand}>
              <Logo label={profile.brand} className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
            </Link>

            <ul className="relative hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      /* The page you are on is marked by weight and ink, with no
                         mark under it. The pill that used to slide between these
                         was a measured box moved by an animation this branch does
                         not run, so it collapsed to a four-pixel speck in the
                         corner of the list; the rule that replaced it was one
                         decoration too many under a bar that already has one. */
                      'font-display relative px-3.5 py-2 text-sm',
                      isActive(item.href)
                        ? 'text-ink font-bold'
                        : 'text-muted hover:text-ink font-semibold',
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
    </>
  )
}
