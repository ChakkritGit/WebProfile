import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getOwnerSession } from '@/auth'
import { redirect } from '@/i18n/navigation'
import { Container } from '@/components/ui/section'
import { SignOutButton } from '@/components/studio/auth-buttons'
import { StudioSession } from '@/components/studio/studio-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Guards every studio route except `/studio/login`, which sits outside this group. */
export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const session = await getOwnerSession()
  if (!session) {
    redirect({ href: '/studio/login', locale })
    // Unreachable: redirect() throws. next-intl's signature isn't `never`,
    // so this keeps the narrowing honest for TypeScript.
    return null
  }

  const t = await getTranslations('studio')
  const name = session.user?.login ?? session.user?.name ?? ''

  return (
    <StudioSession>
      <div className="pb-16">
      <div className="border-line-soft bg-paper-alt border-b">
        <Container className="py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl">{t('title')}</h1>
              <p className="text-muted mt-1 text-sm">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted hidden text-sm sm:inline">
                {t('signedInAs', { name })}
              </span>
              <SignOutButton />
            </div>
          </div>
        </Container>
      </div>

        <Container className="pt-8">{children}</Container>
      </div>
    </StudioSession>
  )
}
