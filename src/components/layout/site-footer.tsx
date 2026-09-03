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
import { WaveDivider } from '@/components/ui/decor'
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

  return (
    <footer className="mt-24">
      <WaveDivider className="text-surface-2 h-12" />

      {/* `-mt-px`: the wave is an SVG and the body a div, so their edge meets at
          whatever fraction of a pixel the layout lands on. Overlapping by one
          pixel means a hairline cannot open up between them at any zoom or
          device pixel ratio. */}
      <div className="bg-surface-2 paper-grain -mt-px">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <p className="font-display text-2xl font-extrabold">{tMeta('siteName')}</p>
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
                        className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
                      >
                        <Icon className="size-[1.15rem]" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            <nav aria-label={tNav('menu')}>
              <p className="font-display text-sm font-bold tracking-wide uppercase">
                {tNav('menu')}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1 lg:grid-cols-2">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="text-muted hover:text-brand text-sm transition-colors"
                    >
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/topics"
                    className="text-muted hover:text-brand text-sm transition-colors"
                  >
                    {tNav('topics')}
                  </Link>
                </li>
              </ul>
            </nav>

            <div>
              <p className="font-display text-sm font-bold tracking-wide uppercase">
                {t('linksTitle')}
              </p>
              {/* Icon-only: each link carries its label via aria-label/title. */}
              <ul className="mt-3 flex items-center gap-2">
                <li>
                  <WebringBadge
                    size={20}
                    mono
                    label={t('webringAlt')}
                    className="sticker-sm sticker-hover bg-surface text-ink grid size-10 place-items-center"
                  />
                </li>
                <li>
                  <a
                    href="/feed.xml"
                    aria-label={t('rss')}
                    title={t('rss')}
                    className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
                  >
                    <RssIcon className="size-[1.15rem]" />
                  </a>
                </li>
                <li>
                  <a
                    href="/sitemap.xml"
                    aria-label={t('sitemap')}
                    title={t('sitemap')}
                    className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
                  >
                    <SitemapIcon className="size-[1.15rem]" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="drawn-rule-top relative mt-10 flex flex-col-reverse items-center justify-between gap-4 pt-7 sm:flex-row">
            <p className="text-muted text-center text-sm sm:text-left">
              {t('copyright', { year, name: tMeta('siteName') })}
            </p>
            <BackToTop label={t('backToTop')} />
          </div>
        </div>
      </div>
    </footer>
  )
}
