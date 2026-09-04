'use client'

import { useTranslations } from 'next-intl'
import { QUICK_CONTACT, socials, type SocialId } from '@/config/site'
import { GitHubIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { useAtFooter, useScrolledPast } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const ICONS: Partial<Record<SocialId, typeof MailIcon>> = {
  github: GitHubIcon,
  email: MailIcon,
  phone: PhoneIcon,
}

const TONES = ['bg-sun-soft', 'bg-mint-soft', 'bg-sky-soft']

/**
 * How much of the bottom of the screen the dock takes up, offset included. Two
 * numbers because it has two shapes: a column of three on a wide screen and a
 * row of three on a narrow one.
 */
const DOCK_BAND = { column: 190, row: 116 }

/**
 * Always-reachable contact dock. One tap goes straight to GitHub, the phone
 * dialler or the mail client — no intermediate page.
 */
export function QuickContactDock() {
  const t = useTranslations('footer')

  // Held back until the visitor has engaged with the page a little, and stood
  // down again at the foot of it, where the footer carries the same links.
  const scrolled = useScrolledPast(240)
  const atFooter = useAtFooter(DOCK_BAND.column, DOCK_BAND.row)
  const visible = scrolled && !atFooter

  const links = QUICK_CONTACT.map((id) => socials.find((s) => s.id === id)).filter(
    (s): s is (typeof socials)[number] => Boolean(s),
  )

  return (
    // Faded rather than unmounted, matching the festival picker in the opposite
    // corner: the two floating controls come and go for the same reasons and had
    // no business doing it differently. `inert` is what makes a faded control
    // genuinely absent — opacity alone leaves it in the tab order and in the
    // accessibility tree, reachable by people who cannot see that it has gone.
    <aside
      aria-label={t('quickContact')}
      inert={!visible}
      className={cn(
        'fixed right-4 bottom-4 z-40 transition-all duration-500 sm:right-6 sm:bottom-6',
        !visible && 'pointer-events-none translate-y-4 opacity-0',
      )}
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
    </aside>
  )
}
