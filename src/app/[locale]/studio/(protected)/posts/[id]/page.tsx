import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getPostById } from '@/lib/content'
import { ContentForm } from '@/components/studio/content-form'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)

  const record = await getPostById(id)
  if (!record) notFound()

  const t = await getTranslations('studio')

  return (
    <ContentForm
      heading={t('editPost')}
      kind="posts"
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
      }}
    />
  )
}
