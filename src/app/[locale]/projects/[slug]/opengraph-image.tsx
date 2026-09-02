import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getProject } from '@/lib/content'
import { clampText, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card'
import { profile } from '@/config/site'
import { decodeParam } from '@/lib/slug'

export const alt = 'Project'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  const project = await getProject(slug, locale as Locale)
  const t = await getTranslations({ locale, namespace: 'projects' })

  return renderOgCard({
    eyebrow: t('title'),
    title: clampText(project?.title ?? slug, 90),
    // Stack reads better than the summary on a project card.
    subtitle: project?.stack.length
      ? clampText(project.stack.slice(0, 4).join(' · '), 70)
      : (project?.summary ?? profile.name),
  })
}
