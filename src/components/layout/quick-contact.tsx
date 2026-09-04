'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { QUICK_CONTACT, socials, type SocialId } from '@/config/site'
import { GitHubIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const ICONS: Partial<Record<SocialId, typeof MailIcon>> = {
  github: GitHubIcon,
  email: MailIcon,
  phone: PhoneIcon,
}

const TONES = ['bg-sun-soft', 'bg-mint-soft', 'bg-sky-soft']

/**
 * How much of the bottom of the screen the dock takes up, offset included.
 *
 * Two numbers because it has two shapes: a column of three on a wide screen and
 * a row of three on a narrow one. One value for both hid it a third of the way
 * up a phone, long before anything was in its way.
 */
const DOCK_BAND = { column: 190, row: 116 }

/**
 * Always-reachable contact dock. One tap goes straight to GitHub, the phone
 * dialler or the mail client — no intermediate page.
 */
export function QuickContactDock() {
  const t = useTranslations('footer')
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)

  // Held back until the visitor has engaged with the page a little, and stood
  // down again at the foot of it: the footer carries the same links and its own
  // back-to-top button, and down there the dock only sits on top of them.
  //
  // Measured against the footer rather than the document height, so it does not
  // need to know how tall the footer happens to be on a given page — it hides
  // once the footer has risen into the band the dock occupies.
  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector('footer')
      const band = window.innerWidth >= 640 ? DOCK_BAND.column : DOCK_BAND.row
      const reachedFoot = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - band
        : false
      setVisible(window.scrollY > 240 && !reachedFoot)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const links = QUICK_CONTACT.map((id) => socials.find((s) => s.id === id)).filter(
    (s): s is (typeof socials)[number] => Boolean(s),
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          aria-label={t('quickContact')}
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
          transition={{ duration: 0.28, ease: [0.34, 1.4, 0.64, 1] }}
          className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6"
        >
          <ul className="sticker bg-paper/90 flex items-center gap-1.5 p-1.5 backdrop-blur-md sm:flex-col">
            {links.map((link, i) => {
              const Icon = ICONS[link.id]
              const external = link.href.startsWith('http')
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-label={`${link.label}: ${link.handle}`}
                    title={`${link.label} — ${link.handle}`}
                    {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                    className={cn(
                      'border-line grid size-11 place-items-center rounded-full border-2',
                      'transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 active:scale-95',
                      TONES[i % TONES.length],
                    )}
                  >
                    {Icon ? <Icon className="size-5" /> : null}
                  </a>
                </li>
              )
            })}
          </ul>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
