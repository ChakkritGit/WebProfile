'use client'

import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { MorphingDialog, MorphingTrigger } from '@/components/ui/morphing-dialog'
import { Button, ButtonLink } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  // The PDF viewer is only mounted once the panel has finished growing. Booting
  // it at button size makes it lay a page out at ~28% of the final width and
  // then be dragged through the whole morph, which is what the stutter was.
  const [grown, setGrown] = useState(false)
  const morphId = useId()

  return (
    <>
      <MorphingTrigger layoutId={morphId} open={open}>
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
      </MorphingTrigger>

      <MorphingDialog
        layoutId={morphId}
        open={open}
        onClose={() => {
          setOpen(false)
          setGrown(false)
        }}
        onOpened={() => setGrown(true)}
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
          {grown ? (
            <object data={profile.resume} type="application/pdf" className="size-full">
              <div className="grid h-full place-items-center p-6 text-center">
                <p className="text-muted text-sm">{t('resumeFallback')}</p>
              </div>
            </object>
          ) : (
            <div role="status" aria-busy="true" className="size-full">
              <span className="sr-only">{t('loading')}</span>
              <Skeleton className="size-full rounded-none" />
            </div>
          )}
        </div>
      </MorphingDialog>
    </>
  )
}
