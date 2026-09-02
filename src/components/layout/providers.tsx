'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'

/**
 * Site-wide providers.
 *
 * Deliberately NO SessionProvider here: public pages never read a session, and
 * mounting it would make every visitor fetch /api/auth/session on load. The
 * studio wraps its own subtree instead (see components/studio/studio-session).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}
