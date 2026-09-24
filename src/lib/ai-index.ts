import { absoluteUrl } from './seo'
import type { PostRecord, ProjectRecord } from './content-types'

/**
 * The site as Mr. Worldwide knows it: one line of facts per published article
 * and project, in each language it exists in. The Worker ranks these for a
 * question and turns the chosen ids into cards.
 */
export interface AiItem {
  id: string
  kind: 'post' | 'project'
  locale: 'th' | 'en'
  /** Shared by the translations of one piece, so it is shown once, in the reader's language. */
  group: string
  slug: string
  url: string
  title: string
  summary: string
  tags: string[]
  stack: string[]
  minutes: number
  cover: string | null
}

const LOCALES = new Set(['th', 'en'])

function item(kind: AiItem['kind'], r: PostRecord | ProjectRecord): AiItem {
  const locale = r.locale as AiItem['locale']
  return {
    id: `${kind}:${locale}:${r.slug}`,
    kind,
    locale,
    group: r.translationKey ?? `${kind}:${r.slug}`,
    slug: r.slug,
    url: absoluteUrl(`/${kind === 'post' ? 'blog' : 'projects'}/${r.slug}`, locale),
    title: r.title,
    summary: r.summary ?? '',
    tags: r.tags,
    stack: 'stack' in r ? r.stack : [],
    minutes: r.readingMinutes,
    cover: r.coverImage,
  }
}

export function toAiItems(posts: PostRecord[], projects: ProjectRecord[]): AiItem[] {
  const seen = new Map<string, AiItem>()
  const add = (kind: AiItem['kind'], r: PostRecord | ProjectRecord) => {
    if (r.status !== 'PUBLISHED' || !LOCALES.has(r.locale)) return
    const it = item(kind, r)
    if (!seen.has(it.id)) seen.set(it.id, it)
  }
  posts.forEach((p) => add('post', p))
  projects.forEach((p) => add('project', p))
  return [...seen.values()]
}
