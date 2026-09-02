import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { getOwnerSession } from '@/auth'
import { Container } from '@/components/ui/section'
import { StickerCard } from '@/components/ui/sticker-card'
import { SignInButton } from '@/components/studio/auth-buttons'
import { StudioSession } from '@/components/studio/studio-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function StudioLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { locale } = await params
  const { error } = await searchParams

  // Already the owner? Skip the login screen entirely.
  if (await getOwnerSession()) redirect({ href: '/studio', locale })

  const t = await getTranslations('studio')

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <StickerCard size="lg" className="w-full max-w-md p-8 text-center">
        <h1 className="text-3xl">{t('loginTitle')}</h1>
        <p className="text-muted mt-3">{t('loginBody')}</p>

        {error && (
          <div className="sticker-sm bg-brand-soft mt-5 p-4 text-start">
            <p className="font-display font-bold">{t('denied')}</p>
            <p className="text-ink-soft mt-1 text-sm">{t('deniedBody')}</p>
          </div>
        )}

        <div className="mt-7 flex justify-center">
          <StudioSession>
            <SignInButton />
          </StudioSession>
        </div>
      </StickerCard>
    </Container>
  )
}
