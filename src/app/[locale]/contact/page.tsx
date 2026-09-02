import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { profile, socials } from '@/config/site'
import { cn } from '@/lib/utils'
import { buildMetadata } from '@/lib/seo'
import { PageHeader, Section } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { ContactForm } from '@/components/content/contact-form'
import {
  FacebookIcon,
  GitHubIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TikTokIcon,
} from '@/components/icons'

const ICONS = {
  github: GitHubIcon,
  email: MailIcon,
  phone: PhoneIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
} as const

const DIRECT = ['email', 'phone', 'github'] as const
// Written out in full so Tailwind's scanner can see each class literally.
const DIRECT_TONES = ['bg-brand-soft', 'bg-mint-soft', 'bg-sun-soft'] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return buildMetadata({
    title: t('title'),
    description: t('subtitle'),
    path: '/contact',
    locale: locale as Locale,
  })
}

export default async function ContactPage() {
  const t = await getTranslations('contact')
  const elsewhere = socials.filter((s) => !DIRECT.includes(s.id as (typeof DIRECT)[number]))

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl">{t('directTitle')}</h2>
              <RevealGroup className="space-y-3">
                {DIRECT.map((id, i) => {
                  const link = socials.find((s) => s.id === id)
                  if (!link) return null
                  const Icon = ICONS[id]
                  const external = link.href.startsWith('http')
                  return (
                    <RevealItem key={id}>
                      <a
                        href={link.href}
                        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                        className="sticker sticker-hover bg-surface flex items-center gap-4 p-4 no-underline"
                      >
                        <span
                          className={cn(
                            'border-line grid size-11 shrink-0 place-items-center rounded-xl border-2',
                            DIRECT_TONES[i],
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="font-display block text-sm font-bold">{link.label}</span>
                          <span className="text-muted block truncate text-sm">{link.handle}</span>
                        </span>
                      </a>
                    </RevealItem>
                  )
                })}
              </RevealGroup>
            </div>

            <Reveal>
              <StickerCard tone="sun" className="p-5">
                <p className="font-display flex items-center gap-2 font-bold">
                  <MapPinIcon className="size-4" />
                  {t('locationTitle')}
                </p>
                <p className="text-ink-soft mt-1 text-sm">{profile.location}</p>
              </StickerCard>
            </Reveal>

            <Reveal>
              <StickerCard tone="mint" className="p-5">
                <p className="font-display font-bold">{t('availabilityTitle')}</p>
                <p className="text-ink-soft mt-1 text-sm leading-relaxed">{t('availabilityBody')}</p>
              </StickerCard>
            </Reveal>

            <div>
              <h2 className="mb-3 text-xl">{t('socialTitle')}</h2>
              <ul className="flex flex-wrap gap-2">
                {elsewhere.map((link) => {
                  const Icon = ICONS[link.id]
                  return (
                    <li key={link.id}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${link.label}: ${link.handle}`}
                        className="sticker-sm sticker-hover bg-surface flex items-center gap-2 px-4 py-2 text-sm no-underline"
                      >
                        <Icon className="size-4" />
                        {link.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <Reveal direction="left">
            <ContactForm email={profile.email} />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
