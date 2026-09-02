import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getProjectById } from '@/lib/content'
import { ContentForm } from '@/components/studio/content-form'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)

  const record = await getProjectById(id)
  if (!record) notFound()

  const t = await getTranslations('studio')

  return (
    <ContentForm
      heading={t('editProject')}
      kind="projects"
      id={record.id}
      initial={{
        title: record.title,
        slug: record.slug,
        locale: record.locale,
        translationKey: record.translationKey ?? '',
        summary: record.summary ?? '',
        coverImage: record.coverImage ?? '',
        tags: record.tags,
        status: record.status,
        featured: record.featured,
        content: record.content,
        role: record.role ?? '',
        stack: record.stack,
        year: record.year ? String(record.year) : '',
        liveUrl: record.liveUrl ?? '',
        repoUrl: record.repoUrl ?? '',
        sortOrder: String(record.sortOrder),
      }}
    />
  )
}
