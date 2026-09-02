'use client'

import { useTransition } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { GitHubIcon } from '@/components/icons'

export function SignInButton({ callbackUrl = '/studio' }: { callbackUrl?: string }) {
  const t = useTranslations('studio')
  const [pending, start] = useTransition()

  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() => start(() => void signIn('github', { callbackUrl }))}
    >
      <GitHubIcon className="size-5" />
      {t('signIn')}
    </Button>
  )
}

export function SignOutButton() {
  const t = useTranslations('studio')
  const [pending, start] = useTransition()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => void signOut({ callbackUrl: '/' }))}
    >
      {t('signOut')}
    </Button>
  )
}
