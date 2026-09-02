'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/** Scopes the session context to the studio, where sign-in/out actually runs. */
export function StudioSession({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
