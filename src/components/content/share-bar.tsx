'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BlueskyIcon,
  CheckIcon,
  CopyIcon,
  FacebookIcon,
  ThreadsIcon,
  XIcon,
} from '@/components/icons'

/**
 * Where each network wants the post handed to it.
 *
 * Only Facebook takes a bare URL — the other three compose a post, so the title
 * goes in the text and the link rides along with it. Bluesky has no separate
 * url field at all; it reads the link out of the text the way a post does.
 */
const NETWORKS = [
  {
    id: 'x',
    label: 'X',
    Icon: XIcon,
    href: (url: string, title: string) =>
      `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    Icon: BlueskyIcon,
    href: (url: string, title: string) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'threads',
    label: 'Threads',
    Icon: ThreadsIcon,
    href: (url: string, title: string) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
] as const

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
    <div className="drawn-rule-top relative mt-12 flex flex-wrap items-center gap-3 pt-7">
      <button
        type="button"
        onClick={copy}
        className="sticker-sm sticker-hover bg-surface font-display inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? t('copied') : t('copyLink')}
      </button>
      {NETWORKS.map(({ id, label, Icon, href }) => (
        <a
          key={id}
          href={href(url, title)}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Share on ${label}`}
          className="sticker-sm sticker-hover bg-surface grid size-10 place-items-center"
        >
          <Icon className="size-[1.15rem]" />
        </a>
      ))}
    </div>
  )
}
