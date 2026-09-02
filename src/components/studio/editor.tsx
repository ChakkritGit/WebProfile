'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { EditorDocument } from '@/lib/editor'

/**
 * Editor.js touches `document` at import time, so the core is loaded only in
 * the browser. Everything above this boundary stays server-renderable.
 */
const EditorCore = dynamic(() => import('./editor-core'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

function EditorSkeleton() {
  return (
    <div className="text-muted animate-pulse space-y-3 p-6">
      <div className="bg-line-soft h-6 w-1/3 rounded-lg" />
      <div className="bg-line-soft h-4 w-full rounded-lg" />
      <div className="bg-line-soft h-4 w-5/6 rounded-lg" />
      <div className="bg-line-soft h-4 w-2/3 rounded-lg" />
    </div>
  )
}

export function Editor({
  initialData,
  onChange,
}: {
  initialData: EditorDocument
  onChange: (data: EditorDocument) => void
}) {
  const t = useTranslations('studio')
  return (
    <div className="sticker bg-surface min-h-[26rem] overflow-visible px-4 py-6 sm:px-8">
      <EditorCore initialData={initialData} onChange={onChange} placeholder={t('fieldContent')} />
    </div>
  )
}
