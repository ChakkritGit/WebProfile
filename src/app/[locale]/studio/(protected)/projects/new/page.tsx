import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { ContentForm } from '@/components/studio/content-form'

export default async function NewProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('studio')

  return <ContentForm heading={t('newProject')} kind="projects" initial={{ locale }} />
}
