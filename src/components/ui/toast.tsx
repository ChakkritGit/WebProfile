'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckIcon, CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Toasts for actions whose result is not already visible on screen.
 *
 * Not every action deserves one: flipping a status in a list already shows the
 * new badge in place, and a toast for it is noise. These are for writes whose
 * outcome happens elsewhere — a delete that navigates away, a save that changes
 * nothing visible — and for every failure.
 */

type ToastTone = 'success' | 'error'
type Toast = { id: number; tone: ToastTone; message: string }

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null)

/** Announces a result. Safe to call outside the provider — it simply does nothing. */
export function useToast() {
  return useContext(ToastContext) ?? (() => {})
}

const AlertIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="9.2" strokeWidth="1.9" />
  </svg>
)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const reduce = useReducedMotion()

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      // Three at a time: a stack taller than that covers the page it reports on.
      setToasts((current) => [...current.slice(-2), { id, tone, message }])
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3600)
    },
    [dismiss],
  )

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Bottom-left on desktop: the quick-contact dock owns the right corner.
          Centred on narrow screens, lifted clear of that dock. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:items-start"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className={cn(
                'sticker pointer-events-auto flex w-full max-w-sm items-center gap-3 p-3 pe-2.5 sm:w-auto sm:min-w-[16rem]',
                toast.tone === 'error' ? 'bg-toast-error' : 'bg-surface',
              )}
            >
              <span
                className={cn(
                  'border-line grid size-8 shrink-0 place-items-center rounded-xl border-2',
                  toast.tone === 'error'
                    ? 'bg-toast-error-chip text-toast-error-ink'
                    : 'bg-mint-soft text-ink',
                )}
              >
                {toast.tone === 'error' ? (
                  <AlertIcon className="size-4" />
                ) : (
                  <CheckIcon className="size-4" />
                )}
              </span>
              <p className="font-display text-ink min-w-0 flex-1 text-sm font-semibold">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-muted hover:text-ink hover:bg-surface-2 grid size-7 shrink-0 place-items-center rounded-lg transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
