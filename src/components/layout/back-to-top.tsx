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
      className="border-line hover:border-line-strong hover:text-brand-strong inline-flex items-center gap-2 border px-4 py-2 font-mono text-xs uppercase transition-colors"
    >
      <ArrowUpIcon className="size-4" />
      {label}
    </button>
  )
}
