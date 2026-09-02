import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getPost } from '@/lib/content'
import { clampText, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card'
import { profile } from '@/config/site'

export const alt = 'Article'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const post = await getPost(slug, locale as Locale)
  const t = await getTranslations({ locale, namespace: 'blog' })

  return renderOgCard({
    eyebrow: t('title'),
    title: clampText(post?.title ?? slug, 90),
    subtitle: post?.summary ? clampText(post.summary, 58) : profile.name,
  })
}
