'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { EditorDocument } from '@/lib/editor'
import { Skeleton, SkeletonLines } from '@/components/ui/skeleton'

/**
 * Editor.js touches `document` at import time, so the core is loaded only in
 * the browser. Everything above this boundary stays server-renderable.
 */
const EditorCore = dynamic(() => import('./editor-core'), {
  ssr: false,
  loading: () => <EditorSkeleton label="Loading editor" />,
})

function EditorSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5 p-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-7 w-2/5" />
      <SkeletonLines count={3} label={label} />
      <Skeleton className="h-24 w-full rounded-xl" />
      <SkeletonLines count={2} label={label} />
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
