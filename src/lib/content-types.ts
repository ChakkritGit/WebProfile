import type { EditorDocument } from './editor'
import type { Locale } from '@/i18n/routing'

export type ContentStatus = 'DRAFT' | 'PUBLISHED'

export interface ContentBase {
  views: number
  id: string
  slug: string
  locale: Locale
  translationKey: string | null
  title: string
  summary: string | null
  coverImage: string | null
  content: EditorDocument
  tags: string[]
  status: ContentStatus
  featured: boolean
  publishedAt: string | null
  updatedAt: string
}

export interface PostRecord extends ContentBase {
  readingMinutes: number
}

export interface ProjectRecord extends ContentBase {
  role: string | null
  stack: string[]
  year: number | null
  liveUrl: string | null
  repoUrl: string | null
  sortOrder: number
}

export type ContentKind = 'post' | 'project'

export interface ListOptions {
  locale: Locale
  /** Include drafts. Only ever true for authenticated studio views. */
  includeDrafts?: boolean
  limit?: number
  tag?: string
  featuredOnly?: boolean
  /** Order by view count instead of date — used by the "most read" strip. */
  orderBy?: 'recent' | 'views'
  /**
   * Return every row in every language, untouched — no collapsing of translations.
   * Only the studio wants this: it manages each translation as its own entry, and
   * must never hide a row just because a sibling translation ranked higher.
   */
  allLocales?: boolean
}
