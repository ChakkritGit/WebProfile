'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { GitHubIcon } from '@/components/icons'

export function SignInButton({ callbackUrl = '/studio' }: { callbackUrl?: string }) {
  const t = useTranslations('studio')
  // Not useTransition: `signIn` returns a promise and navigates away, so the
  // transition callback resolves immediately and the pending flag never sticks.
  const [pending, setPending] = useState(false)

  return (
    <Button
      size="lg"
      loading={pending}
      loadingLabel={t('signIn')}
      onClick={() => {
        setPending(true)
        // Only re-enable if it fails; on success the page navigates away.
        void signIn('github', { callbackUrl }).catch(() => setPending(false))
      }}
    >
      {!pending && <GitHubIcon className="size-5" />}
      {t('signIn')}
    </Button>
  )
}

export function SignOutButton() {
  const t = useTranslations('studio')
  const [pending, setPending] = useState(false)

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      loadingLabel={t('signOut')}
      onClick={() => {
        setPending(true)
        void signOut({ callbackUrl: '/' }).catch(() => setPending(false))
      }}
    >
      {t('signOut')}
    </Button>
  )
}
