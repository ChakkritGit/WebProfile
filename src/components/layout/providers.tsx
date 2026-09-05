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
/*
 * `disableTransitionOnChange` is deliberately absent. It exists to stop a theme
 * switch from dragging every hover and layout transition on the page along with
 * it — but the switch is meant to fade now, and the fade is turned on for
 * exactly the moment it takes and off again (see `fadeTheme`), so nothing is
 * left transitioning afterwards.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}
