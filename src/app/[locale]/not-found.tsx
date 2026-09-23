import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import {
  ArrowRightIcon,
  CodeIcon,
  LayersIcon,
  MailIcon,
  SparkleIcon,
} from '@/components/icons'

const DESTINATIONS = [
  { key: 'home', href: '/', icon: SparkleIcon },
  { key: 'projects', href: '/projects', icon: LayersIcon },
  { key: 'blog', href: '/blog', icon: CodeIcon },
  { key: 'contact', href: '/about#contact', icon: MailIcon },
]

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="star-grid pointer-events-none absolute inset-0" />

      <Container className="relative z-10 py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="border-line bg-surface label-mono inline-block border px-3 py-1">
            {t('badge')}
          </span>

          <div className="relative mt-6">
            <p aria-hidden className="text-brand-strong font-mono text-[6rem] leading-[0.85] sm:text-[9rem]">
              404
            </p>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl">{t('title')}</h1>
          <p className="text-muted mt-3 text-lg text-pretty">{t('body')}</p>
        </Reveal>

        <p className="label-mono text-muted mt-12 mb-4 text-center">
          {t('suggestions')}
        </p>

        <RevealGroup className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {DESTINATIONS.map(({ key, href, icon: Icon }) => (
            <RevealItem key={key}>
              <Link href={href} className="block h-full no-underline">
                <StickerCard interactive className="flex h-full items-center gap-4 p-5">
                  <span className="text-brand-strong grid size-11 shrink-0 place-items-center">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg">
                      {t(key as 'home')}
                    </span>
                    <span className="text-ink-soft mt-0.5 block text-sm">
                      {t(`${key}Hint` as 'homeHint')}
                    </span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0" />
                </StickerCard>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </div>
  )
}
