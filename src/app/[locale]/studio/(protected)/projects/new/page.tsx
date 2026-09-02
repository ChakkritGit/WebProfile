import { getTranslations } from 'next-intl/server'
import { ContentForm } from '@/components/studio/content-form'

export default async function NewProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('studio')

  return <ContentForm heading={t('newProject')} kind="projects" initial={{ locale }} />
}
