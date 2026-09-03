'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, CopyIcon } from '@/components/icons'

/**
 * Code block with a copy button.
 *
 * `highlighted` is markup produced by Shiki on the server. It is generated from
 * the stored code by our own highlighter — not author-supplied HTML — so it is
 * safe to insert directly; when highlighting is unavailable the raw text is
 * rendered as a plain React child instead.
 */
export function CodeBlock({
  code,
  language,
  highlighted,
}: {
  code: string
  language?: string
  highlighted?: string | null
}) {
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
    <div className="sticker group relative my-7 overflow-hidden">
      <div className="drawn-rule relative flex items-center justify-between px-4 py-2">
        <span className="font-display text-muted text-xs font-bold tracking-[0.12em] uppercase">
          {language && language !== 'text' ? language : 'code'}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t('copied') : t('copyLink')}
          className="text-muted hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </button>
      </div>

      {highlighted ? (
        <div
          className="shiki-block overflow-x-auto text-[0.9rem] leading-[1.75]"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="bg-surface-2 overflow-x-auto p-5 text-[0.9rem] leading-[1.75]">
          <code className="font-mono font-medium">{code}</code>
        </pre>
      )}
    </div>
  )
}
