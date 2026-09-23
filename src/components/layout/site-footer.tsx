import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { navItems } from '@/config/nav'
import { socials } from '@/config/site'
import {
  FacebookIcon,
  GitHubIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  RssIcon,
  SitemapIcon,
  TikTokIcon,
} from '@/components/icons'
import { WebringBadge } from './webring-badge'
import { BackToTop } from './back-to-top'

const SOCIAL_ICONS = {
  github: GitHubIcon,
  email: MailIcon,
  phone: PhoneIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
} as const

export async function SiteFooter() {
  const t = await getTranslations('footer')
  const tNav = await getTranslations('nav')
  const tMeta = await getTranslations('meta')
  const year = new Date().getFullYear()

  const icon = 'border-line hover:border-line-strong hover:text-brand-strong grid size-10 place-items-center border transition-colors'
  const label = 'label-mono text-muted'

  return (
    <footer className="border-line mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-3xl uppercase [font-stretch:72%]">{tMeta('siteName')}</p>
            <p className="text-muted mt-2 max-w-sm text-sm">{t('builtWith')}</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.id]
                const external = social.href.startsWith('http')
                return (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      aria-label={`${social.label}: ${social.handle}`}
                      title={`${social.label} — ${social.handle}`}
                      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      className={icon}
                    >
                      <Icon className="size-[1.05rem]" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <nav aria-label={tNav('menu')}>
            <p className={label}>{tNav('menu')}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1 lg:grid-cols-2">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-ink-soft hover:text-brand-strong text-sm no-underline transition-colors"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={label}>{t('linksTitle')}</p>
            {/* Icon-only: each link carries its label via aria-label/title. */}
            <ul className="mt-4 flex items-center gap-2">
              <li>
                <WebringBadge size={20} label={t('webringAlt')} className={icon} />
              </li>
              <li>
                <a href="/feed.xml" aria-label={t('rss')} title={t('rss')} className={icon}>
                  <RssIcon className="size-[1.05rem]" />
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" aria-label={t('sitemap')} title={t('sitemap')} className={icon}>
                  <SitemapIcon className="size-[1.05rem]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-line mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-muted text-center font-mono text-xs uppercase sm:text-left">
            {t('copyright', { year, name: tMeta('siteName') })}
          </p>
          <BackToTop label={t('backToTop')} />
        </div>
      </div>
    </footer>
  )
}
