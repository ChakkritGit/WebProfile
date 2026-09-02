import { getTranslations } from 'next-intl/server'
import { profile } from '@/config/site'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card'

export const alt = `${profile.name} — ${profile.role}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return renderOgCard({ eyebrow: 'Portfolio', title: t('siteName'), subtitle: t('tagline') })
}
