import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { ContentForm } from '@/components/studio/content-form'

export default async function NewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('studio')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">{t('newProject')}</h2>
      <ContentForm kind="projects" initial={{ locale }} />
    </div>
  )
}
