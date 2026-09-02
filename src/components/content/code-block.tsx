'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, CopyIcon } from '@/components/icons'

export function CodeBlock({ code }: { code: string }) {
  const t = useTranslations('common')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked by permissions; the code is still selectable.
    }
  }

  return (
    <div className="sticker group relative my-7 overflow-hidden bg-[#17131f] text-[#f5f2ec]">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? t('copied') : t('copyLink')}
        className="absolute end-3 top-3 z-10 grid size-9 place-items-center rounded-lg border-2 border-white/25 bg-white/10 opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100 hover:bg-white/20"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </button>
      <pre className="overflow-x-auto p-5 text-[0.9rem] leading-[1.75] tracking-[0.01em]">
        <code className="font-mono font-medium">{code}</code>
      </pre>
    </div>
  )
}
