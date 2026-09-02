'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, CopyIcon, FacebookIcon } from '@/components/icons'

export function ShareBar({ url, title }: { url: string; title: string }) {
  const t = useTranslations('common')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      // navigator.share is nicer on mobile; fall back to the clipboard.
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // User dismissed the share sheet, or the clipboard was blocked.
    }
  }

  return (
    <div className="border-line-soft mt-12 flex flex-wrap items-center gap-3 border-t pt-6">
      <button
        type="button"
        onClick={copy}
        className="sticker-sm sticker-hover bg-surface font-display inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? t('copied') : t('copyLink')}
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Share on Facebook"
        className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
      >
        <FacebookIcon className="size-[1.15rem]" />
      </a>
    </div>
  )
}
