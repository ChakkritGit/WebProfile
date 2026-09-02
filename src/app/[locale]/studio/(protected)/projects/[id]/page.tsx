import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getProjectById } from '@/lib/content'
import { ContentForm } from '@/components/studio/content-form'

export default async function EditPage({
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
    <div className="space-y-6">
      <h2 className="text-2xl">{t('editProject')}</h2>
      <ContentForm
        kind="projects"
        id={record.id}
        initial={{
          title: record.title,
          slug: record.slug,
          locale: record.locale,
          translationKey: record.translationKey ?? '',
          summary: record.summary ?? '',
          coverImage: record.coverImage ?? '',
          tags: record.tags.join(', '),
          status: record.status,
          featured: record.featured,
          content: record.content,
          role: record.role ?? '',
          stack: record.stack.join(', '),
          year: record.year ? String(record.year) : '',
          liveUrl: record.liveUrl ?? '',
          repoUrl: record.repoUrl ?? '',
          sortOrder: String(record.sortOrder),
        }}
      />
    </div>
  )
}
