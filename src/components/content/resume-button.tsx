'use client'

import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'motion/react'
import { MorphingDialog } from '@/components/ui/morphing-dialog'
import { Button, ButtonLink } from '@/components/ui/button'
import { DownloadIcon, ExternalLinkIcon } from '@/components/icons'
import { profile } from '@/config/site'

/**
 * Opens the résumé inline instead of downloading it.
 *
 * A download makes a curious visitor commit to a file before they know whether
 * it's worth reading; previewing gets them to the content immediately, with the
 * download still one click away.
 *
 * Small screens skip the modal — mobile browsers (iOS especially) refuse to
 * render a PDF inside an iframe, so they get the browser's own viewer instead.
 */
export function ResumeButton({
  children,
  variant = 'secondary',
  size = 'lg',
  className,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)
  const morphId = useId()

  return (
    <>
      {/* The wrapper carries the shared id rather than the button itself: the
          panel morphs out of this box, and this box is exactly the button. */}
      <motion.div layoutId={morphId} className="inline-flex">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => {
            const inlineCapable =
              typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
            if (inlineCapable) setOpen(true)
            else window.open(profile.resume, '_blank', 'noopener')
          }}
        >
          {children}
        </Button>
      </motion.div>

      <MorphingDialog
        layoutId={morphId}
        open={open}
        onClose={() => setOpen(false)}
        title={t('resumeTitle')}
        className="w-[min(94vw,56rem)]"
        footer={
          <>
            <ButtonLink href={profile.resume} variant="outline" size="sm" external>
              <ExternalLinkIcon className="size-4" />
              {t('resumeOpenTab')}
            </ButtonLink>
            <ButtonLink href={profile.resume} variant="primary" size="sm" external download>
              <DownloadIcon className="size-4" />
              {t('resumeDownload')}
            </ButtonLink>
          </>
        }
      >
        <div className="sticker-sm bg-surface-2 h-[70vh] overflow-hidden">
          <object data={profile.resume} type="application/pdf" className="size-full">
            <div className="grid h-full place-items-center p-6 text-center">
              <p className="text-muted text-sm">{t('resumeFallback')}</p>
            </div>
          </object>
        </div>
      </MorphingDialog>
    </>
  )
}
