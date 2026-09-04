'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Button } from './button'
import { CloseIcon } from '@/components/icons'
import { useIsMounted } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/** The spring the panel grows on. */
const MORPH = { type: 'spring', stiffness: 200, damping: 24 } as const

/**
 * A dialog that grows out of the control that opened it.
 *
 * The trigger and the panel carry the same `layoutId`, so Motion measures both
 * boxes and animates one into the other — the panel appears to be the button,
 * unfolded. Both are mounted while it is open, which is what gives the morph
 * something to travel between.
 *
 * This is deliberately separate from the `Dialog` the rest of the site uses.
 * That one is built on the native `<dialog>` element and gets focus trapping,
 * Esc and the top layer from the platform; a shared-layout morph cannot run
 * through `showModal()` and `close()`, because closing pulls the element out of
 * the top layer before an exit animation could play. So the behaviour the
 * platform was giving away is written out here instead: Escape, the focus trap,
 * the scroll lock, and returning focus to the trigger on the way out.
 */
export function MorphingDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  layoutId,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  /** Shared with the trigger, and the whole point of this component. */
  layoutId: string
}) {
  const t = useTranslations('common')
  const mounted = useIsMounted()
  const reduce = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return

    restoreTo.current = document.activeElement as HTMLElement | null

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    // The scrollbar's width is padded back on so the page behind does not shift
    // sideways as it disappears.
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    document.addEventListener('keydown', onKey)
    const focusFirst = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>('button, [href]')?.focus()
    }, 60)

    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(focusFirst)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      restoreTo.current?.focus()
    }
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <MotionConfig transition={reduce ? { duration: 0 } : MORPH}>
      <AnimatePresence initial={false}>
        {open && (
          <>
            <motion.div
              key="backdrop"
              aria-hidden
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-[#241f2e]/55 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-[81] grid place-items-center p-4">
              <motion.div
                ref={panel}
                layoutId={layoutId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
                // `overflow-hidden` so the contents are clipped to the box while
                // it is still the size and shape of a button.
                className={cn('sticker bg-surface text-ink pointer-events-auto overflow-hidden', className)}
              >
                {/* The panel's own contents fade in once there is room for them —
                    at button size they would be a smear of overlapping text. */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.18, delay: reduce ? 0 : 0.1 }}
                  className="relative p-6"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('resumeClose')}
                    className="sticker-sm sticker-hover bg-surface absolute end-4 top-4 grid size-9 place-items-center"
                  >
                    <CloseIcon className="size-4" />
                  </button>

                  <h2 id={`${id}-title`} className="pe-12 text-xl">
                    {title}
                  </h2>
                  {description && (
                    <div className="text-muted mt-2 text-sm leading-relaxed">{description}</div>
                  )}
                  {children && <div className="mt-4">{children}</div>}
                  {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  )
}

/**
 * A confirmation that grows out of the control that asked for it.
 *
 * The same morph as `MorphingDialog`, with the two buttons a confirmation
 * needs. Worth having here rather than as a variant of the plain `ConfirmDialog`:
 * the destructive answer is the one people are about to give by reflex, and
 * watching the question unfold from the very button they pressed is a beat of
 * hesitation the native dialog does not buy.
 */
export function MorphingConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  pending = false,
  onConfirm,
  onClose,
  layoutId,
  className,
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
  layoutId: string
  className?: string
}) {
  return (
    <MorphingDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      layoutId={layoutId}
      className={cn('w-[min(92vw,30rem)]', className)}
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
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
