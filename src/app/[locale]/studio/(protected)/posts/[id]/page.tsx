import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getPostById } from '@/lib/content'
import { ContentForm } from '@/components/studio/content-form'
import { ButtonLink } from '@/components/ui/button'
import { ArrowRightIcon } from '@/components/icons'

export default async function EditPage({
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
    <div className="space-y-6">
      <div>
        <ButtonLink href="/studio" size="sm" variant="outline" className="mb-4">
          <ArrowRightIcon className="size-4 rotate-180" />
          {t('backToStudio')}
        </ButtonLink>
        <h2 className="text-2xl">{t('editPost')}</h2>
      </div>
      <ContentForm
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
    </div>
  )
}
