'use client'

import { ArrowUpIcon } from '@/components/icons'

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
      className="sticker-sm sticker-hover bg-surface font-display inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
    >
      <ArrowUpIcon className="size-4" />
      {label}
    </button>
  )
}
