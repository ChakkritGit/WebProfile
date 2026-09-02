import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { StarBurst, StarGrid } from '@/components/ui/decor'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import {
  ArrowRightIcon,
  CodeIcon,
  LayersIcon,
  MailIcon,
  SparkleIcon,
} from '@/components/icons'

const DESTINATIONS = [
  { key: 'home', href: '/', icon: SparkleIcon, tone: 'brand' as const },
  { key: 'projects', href: '/projects', icon: LayersIcon, tone: 'mint' as const },
  { key: 'blog', href: '/blog', icon: CodeIcon, tone: 'sun' as const },
  { key: 'contact', href: '/contact', icon: MailIcon, tone: 'violet' as const },
]

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="relative overflow-hidden">
      <StarGrid />

      <Container className="relative z-10 py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="sticker-sm bg-surface font-display inline-block px-4 py-1.5 text-xs font-bold tracking-[0.16em] uppercase">
            {t('badge')}
          </span>

          <div className="relative mt-6 inline-block">
            <p
              aria-hidden
              className="font-display text-brand text-[6rem] leading-[0.85] font-extrabold sm:text-[9rem]"
            >
              404
            </p>
            <StarBurst className="animate-wobble absolute -top-3 -right-8 size-11" />
            <StarBurst
              className="animate-wobble absolute -bottom-1 -left-8 size-7"
              color="var(--mint)"
            />
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl">{t('title')}</h1>
          <p className="text-muted mt-3 text-lg text-pretty">{t('body')}</p>
        </Reveal>

        <p className="font-display text-muted mt-12 mb-4 text-center text-xs font-bold tracking-[0.16em] uppercase">
          {t('suggestions')}
        </p>

        <RevealGroup className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {DESTINATIONS.map(({ key, href, icon: Icon, tone }) => (
            <RevealItem key={key}>
              <Link href={href} className="block h-full no-underline">
                <StickerCard tone={tone} interactive className="flex h-full items-center gap-4 p-5">
                  <span className="bg-paper border-line grid size-11 shrink-0 place-items-center rounded-xl border-2">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block font-bold">
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
