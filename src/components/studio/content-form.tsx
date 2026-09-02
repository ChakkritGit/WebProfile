'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Editor } from './editor'
import { Button, ButtonLink } from '@/components/ui/button'
import { StickerCard } from '@/components/ui/sticker-card'
import { ArrowRightIcon, CheckIcon, EyeIcon, TrashIcon } from '@/components/icons'
import { EMPTY_DOCUMENT, type EditorDocument } from '@/lib/editor'
import { localeMeta, routing } from '@/i18n/routing'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/dialog'
import { ImageField } from './image-field'
import { TagPicker } from './tag-picker'
import { cn } from '@/lib/utils'

export type ContentKind = 'posts' | 'projects'

export interface FormValues {
  title: string
  slug: string
  locale: string
  translationKey: string
  summary: string
  coverImage: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
  featured: boolean
  content: EditorDocument
  role: string
  stack: string[]
  year: string
  liveUrl: string
  repoUrl: string
  sortOrder: string
}

export const emptyValues: FormValues = {
  title: '',
  slug: '',
  locale: routing.defaultLocale,
  translationKey: '',
  summary: '',
  coverImage: '',
  tags: [],
  status: 'DRAFT',
  featured: false,
  content: EMPTY_DOCUMENT,
  role: '',
  stack: [],
  year: '',
  liveUrl: '',
  repoUrl: '',
  sortOrder: '0',
}

type FieldErrors = Record<string, string[]>

export function ContentForm({
  kind,
  id,
  initial,
  heading,
}: {
  kind: ContentKind
  id?: string
  initial?: Partial<FormValues>
  /** Page title. Rendered in the sidebar so the editor keeps the full column. */
  heading: string
}) {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [values, setValues] = useState<FormValues>({ ...emptyValues, ...initial })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // The Editor.js instance is uncontrolled; its latest document lives here.
  const contentRef = useRef<EditorDocument>(values.content)
  const initialContent = useMemo(() => values.content, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: [] }))
    setDirty(true)
  }

  const onEditorChange = useCallback((doc: EditorDocument) => {
    contentRef.current = doc
    setDirty(true)
  }, [])

  // Guard against losing an in-progress draft to a stray tab close.
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function payload(overrides: Partial<{ status: 'DRAFT' | 'PUBLISHED' }> = {}) {
    const base = {
      title: values.title,
      slug: values.slug,
      locale: values.locale,
      translationKey: values.translationKey || undefined,
      summary: values.summary || undefined,
      coverImage: values.coverImage || undefined,
      tags: values.tags,
      status: overrides.status ?? values.status,
      featured: values.featured,
      content: contentRef.current,
    }
    if (kind === 'posts') return base
    return {
      ...base,
      role: values.role || undefined,
      stack: values.stack,
      year: values.year ? Number(values.year) : undefined,
      liveUrl: values.liveUrl || undefined,
      repoUrl: values.repoUrl || undefined,
      sortOrder: Number(values.sortOrder || 0),
    }
  }

  async function save(overrides: Partial<{ status: 'DRAFT' | 'PUBLISHED' }> = {}) {
    if (!values.title.trim()) {
      setErrors({ title: [t('requiredTitle')] })
      return
    }

    setSaving(true)
    setFormError(null)
    setErrors({})

    try {
      const response = await fetch(
        id ? `/api/content/${kind}/${id}` : `/api/content/${kind}`,
        {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload(overrides)),
        },
      )
      const body = (await response.json().catch(() => ({}))) as {
        id?: string
        error?: string
        fields?: FieldErrors
      }

      if (!response.ok) {
        setFormError(body.error ?? tCommon('error'))
        if (body.fields) setErrors(body.fields)
        return
      }

      setDirty(false)
      setSavedAt(Date.now())
      if (overrides.status) set('status', overrides.status)

      if (!id && body.id) router.replace(`/studio/${kind}/${body.id}`)
      else router.refresh()
    } catch {
      setFormError(tCommon('error'))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!id) return
    setConfirmOpen(false)
    setSaving(true)
    const response = await fetch(`/api/content/${kind}/${id}`, { method: 'DELETE' })
    setSaving(false)
    if (response.ok) {
      setDirty(false)
      router.push('/studio')
    } else {
      setFormError(tCommon('error'))
    }
  }

  const inputClass = (key: string) =>
    cn(
      'w-full rounded-xl border-2 bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors',
      errors[key]?.length ? 'border-[#e0362f]' : 'border-line-soft focus:border-line',
    )

  const published = values.status === 'PUBLISHED'

  return (
    /* The heading and the back link share the editor's column rather than the
       sidebar's: they name the thing being written, not the metadata beside it.
       Giving them a grid row of their own instead would let the sidebar, which
       spans both rows, stretch that row and open a gap under the heading. */
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-4">
        <div>
          <ButtonLink href="/studio" size="sm" variant="outline" className="mb-3">
            <ArrowRightIcon className="size-4 rotate-180" />
            {t('backToStudio')}
          </ButtonLink>
          <h2 className="text-2xl">{heading}</h2>
        </div>

        <div>
          <label htmlFor="f-title" className="font-display mb-1.5 block text-sm font-semibold">
            {t('fieldTitle')}
          </label>
          <input
            id="f-title"
            className={cn(inputClass('title'), 'font-display !text-lg font-bold')}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <FieldError messages={errors.title} />
        </div>

        <Editor initialData={initialContent} onChange={onEditorChange} />
      </div>

      {/* ------------------------------ sidebar ----------------------------- */}
      <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <StickerCard className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void save()}
              loading={saving}
              loadingLabel={t('saving')}
              className="flex-1"
            >
              {!saving && <CheckIcon className="size-4" />}
              {saving ? t('saving') : t('save')}
            </Button>
            <Button
              size="sm"
              variant={published ? 'secondary' : 'primary'}
              disabled={saving}
              onClick={() => void save({ status: published ? 'DRAFT' : 'PUBLISHED' })}
            >
              <EyeIcon className="size-4" />
              {published ? t('unpublish') : t('publish')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                'border-line rounded-full border-2 px-2.5 py-1 font-semibold',
                published ? 'bg-mint-soft' : 'bg-surface-2',
              )}
            >
              {published ? tCommon('published') : tCommon('draft')}
            </span>
            {savedAt && !dirty && (
              <span className="text-mint inline-flex items-center gap-1 font-semibold">
                <CheckIcon className="size-3.5" />
                {t('saved')}
              </span>
            )}
            {dirty && <span className="text-muted">{t('unsaved')}</span>}
          </div>

          {formError && <p className="text-sm text-[#e0362f]">{formError}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {id && (
              <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)} disabled={saving}>
                <TrashIcon className="size-4" />
                {t('delete')}
              </Button>
            )}
          </div>
        </StickerCard>

        <StickerCard className="space-y-3 p-4">
          <Field label={t('fieldSlug')} hint={t('slugHint')} error={errors.slug}>
            <input
              className={inputClass('slug')}
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </Field>

          <Field label={t('fieldLocale')} error={errors.locale}>
            <Select
              value={values.locale}
              onChange={(next) => set('locale', next)}
              label={t('fieldLocale')}
              options={routing.locales.map((code) => ({
                value: code,
                label: localeMeta[code].label,
                hint: code.toUpperCase(),
              }))}
            />
          </Field>

          <Field label={t('fieldSummary')} error={errors.summary}>
            <textarea
              rows={3}
              className={cn(inputClass('summary'), 'resize-y')}
              value={values.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>

          <Field label={t('fieldCover')} error={errors.coverImage}>
            <ImageField
              value={values.coverImage}
              onChange={(next) => set('coverImage', next)}
              invalid={Boolean(errors.coverImage?.length)}
            />
          </Field>

          <Field label={t('tagsLabel')} error={errors.tags}>
            <TagPicker
              value={values.tags}
              onChange={(next) => set('tags', next)}
              label={t('tagsLabel')}
            />
          </Field>

          <label className="flex items-center gap-2.5 pt-1 text-sm">
            <input
              type="checkbox"
              className="accent-brand size-4"
              checked={values.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            {t('fieldFeatured')}
          </label>
        </StickerCard>

        {kind === 'projects' && (
          <StickerCard className="space-y-3 p-4">
            <Field label={t('fieldRole')} error={errors.role}>
              <input
                className={inputClass('role')}
                value={values.role}
                onChange={(e) => set('role', e.target.value)}
              />
            </Field>
            <Field label={t('fieldStack')} error={errors.stack}>
              <TagPicker
                value={values.stack}
                onChange={(next) => set('stack', next)}
                label={t('fieldStack')}
              />
            </Field>
            <Field label={t('fieldYear')} error={errors.year}>
              <input
                type="number"
                className={inputClass('year')}
                value={values.year}
                onChange={(e) => set('year', e.target.value)}
              />
            </Field>
            <Field label={t('fieldLiveUrl')} error={errors.liveUrl}>
              <input
                className={inputClass('liveUrl')}
                value={values.liveUrl}
                onChange={(e) => set('liveUrl', e.target.value)}
              />
            </Field>
            <Field label={t('fieldRepoUrl')} error={errors.repoUrl}>
              <input
                className={inputClass('repoUrl')}
                value={values.repoUrl}
                onChange={(e) => set('repoUrl', e.target.value)}
              />
            </Field>
          </StickerCard>
        )}
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        title={t('confirmDeleteTitle')}
        description={t('confirmDeleteBody', { title: values.title })}
        confirmLabel={t('confirmDelete')}
        cancelLabel={t('cancel')}
        danger
        pending={saving}
        onConfirm={() => void remove()}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="font-display mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error?.length && <p className="text-muted mt-1 text-xs">{hint}</p>}
      <FieldError messages={error} />
    </div>
  )
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1 text-sm text-[#e0362f]">{messages.join(' ')}</p>
}
