'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

/**
 * Themed modal built on the native <dialog> element.
 *
 * Using `showModal()` rather than a hand-rolled overlay gives focus trapping,
 * Esc-to-close, inert background and the top layer for free — all of which are
 * easy to get subtly wrong by hand.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        // Esc fires `cancel`; route it through our own handler so state stays
        // in sync instead of the element closing itself behind React's back.
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clicking the backdrop lands on the <dialog> itself, not its content.
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="dialog-title"
      className={cn(
        'sticker bg-surface text-ink m-auto w-[min(92vw,30rem)] p-0',
        'backdrop:bg-[#241f2e]/55 backdrop:backdrop-blur-sm',
        'open:animate-pop',
        className,
      )}
    >
      <div className="p-6">
        <h2 id="dialog-title" className="text-xl">
          {title}
        </h2>
        {description && <div className="text-muted mt-2 text-sm leading-relaxed">{description}</div>}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
