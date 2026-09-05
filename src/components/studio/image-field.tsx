'use client'

import { useRef, useState } from 'react'
import Image from '@/components/ui/plain-image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CloseIcon, DownloadIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { compressImage } from '@/lib/compress-image'
import { cn } from '@/lib/utils'

/**
 * Cover image input accepting either a pasted URL or a file upload.
 *
 * Uploads reuse the same `/api/upload` endpoint the editor's image tool posts
 * to, so both paths land in the same Supabase bucket and return a public URL.
 */
export function ImageField({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  const t = useTranslations('studio')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('image', await compressImage(file))
      const response = await fetch('/api/upload', { method: 'POST', body })
      const json = (await response.json().catch(() => ({}))) as {
        success?: number
        file?: { url?: string }
        error?: string
      }
      if (!response.ok || json.success !== 1 || !json.file?.url) {
        setError(json.error ?? t('uploadFailed'))
        return
      }
      onChange(json.file.url)
    } catch {
      setError(t('uploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('coverUrl')}
          aria-label={t('coverUrl')}
          className={cn(
            'bg-paper w-full rounded-xl border-2 px-3.5 py-2.5 text-sm outline-none transition-colors',
            invalid ? 'border-[#e0362f]' : 'border-line-soft focus:border-line',
          )}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="w-full"
        >
          <DownloadIcon className="size-4 rotate-180" />
          {uploading ? t('coverUploading') : t('coverUpload')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
      </div>

      <p className="text-muted mt-1 text-xs">{t('coverHint')}</p>
      {error && <p className="mt-1 text-sm text-[#e0362f]">{error}</p>}

      {uploading && (
        <div role="status" aria-live="polite" aria-busy="true" className="mt-3">
          <span className="sr-only">{t('coverUploading')}</span>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {value && !uploading && (
        <div className="sticker-sm bg-surface-2 relative mt-3 overflow-hidden">
          {/* Unoptimised: the URL may point anywhere, including hosts not in
              next.config's remotePatterns allow-list. */}
          <Image
            src={value}
            alt={t('coverPreview')}
            width={640}
            height={360}
            unoptimized
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('coverRemove')}
            title={t('coverRemove')}
            className="border-line bg-paper absolute end-2 top-2 grid size-8 place-items-center rounded-full border-2"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
