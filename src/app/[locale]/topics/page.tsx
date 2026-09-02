import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { listPosts, listProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'
import { tagSlug } from '@/lib/search'
import { PageHeader, Section } from '@/components/ui/section'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { StickerCard } from '@/components/ui/sticker-card'
import { TagIcon } from '@/components/icons'
import { TechIcon, hasTechIcon } from '@/components/brand/tech-icons'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tagSearch' })
  return buildMetadata({
    title: t('topicsTitle'),
    description: t('topicsSubtitle'),
    path: '/topics',
    locale: locale as Locale,
  })
}

export default async function TopicsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('tagSearch')
  const [posts, projects] = await Promise.all([
    listPosts({ locale: locale as Locale }),
    listProjects({ locale: locale as Locale }),
  ])

  // Stack entries are topics too — that is what makes the tech chips clickable.
  const counts = new Map<string, number>()
  for (const record of [...posts, ...projects]) {
    for (const tag of record.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  for (const project of projects) {
    for (const tech of project.stack) counts.set(tech, (counts.get(tech) ?? 0) + 1)
  }

  const topics = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )

  return (
    <>
      <PageHeader title={t('topicsTitle')} description={t('topicsSubtitle')} />
      <Section>
        <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map(([tag, count]) => (
            <RevealItem key={tag}>
              <Link href={`/topics/${tagSlug(tag)}`} className="block no-underline">
                <StickerCard interactive className="flex items-center gap-3 p-4">
                  <span className="bg-brand-soft border-line grid size-10 shrink-0 place-items-center rounded-xl border-2">
                    {hasTechIcon(tag) ? (
                      <TechIcon name={tag} className="size-[1.15rem]" />
                    ) : (
                      <TagIcon className="size-[1.1rem]" />
                    )}
                  </span>
                  <span className="font-display min-w-0 flex-1 truncate font-bold">{tag}</span>
                  <span className="text-muted font-display text-sm">{count}</span>
                </StickerCard>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </>
  )
}
