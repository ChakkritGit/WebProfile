import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { ContentForm } from '@/components/studio/content-form'
import { ButtonLink } from '@/components/ui/button'
import { ArrowRightIcon } from '@/components/icons'

export default async function NewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('studio')

  return (
    <div className="space-y-6">
      <div>
        <ButtonLink href="/studio" size="sm" variant="outline" className="mb-4">
          <ArrowRightIcon className="size-4 rotate-180" />
          {t('backToStudio')}
        </ButtonLink>
        <h2 className="text-2xl">{t('newProject')}</h2>
      </div>
      <ContentForm kind="projects" initial={{ locale }} />
    </div>
  )
}
