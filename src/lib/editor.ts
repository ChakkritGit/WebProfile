/**
 * Shared Editor.js document shape. The studio writes it, the public renderer
 * reads it, and it is stored verbatim in the `content` JSON column.
 */

export interface EditorBlock<T = Record<string, unknown>> {
  id?: string
  type: string
  data: T
  /** Block tunes, e.g. `{ alignment: { alignment: 'center' } }`. */
  tunes?: Record<string, unknown>
}

export interface EditorDocument {
  time?: number
  blocks: EditorBlock[]
  version?: string
}

export const EMPTY_DOCUMENT: EditorDocument = { blocks: [], version: '2.31.0' }

/** Narrow unknown JSON (e.g. a Prisma Json column) into an EditorDocument. */
export function asEditorDocument(value: unknown): EditorDocument {
  if (!value || typeof value !== 'object') return EMPTY_DOCUMENT
  const candidate = value as Partial<EditorDocument>
  if (!Array.isArray(candidate.blocks)) return EMPTY_DOCUMENT
  return {
    time: candidate.time,
    version: candidate.version,
    blocks: candidate.blocks.filter(
      (b): b is EditorBlock => Boolean(b) && typeof b === 'object' && typeof b.type === 'string',
    ),
  }
}

/** Strip HTML tags that Editor.js inline tools produce, for excerpts and TOC labels. */
export function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Plain-text projection of a document — used for reading time and meta descriptions. */
export function documentToText(doc: EditorDocument): string {
  const parts: string[] = []
  for (const block of doc.blocks) {
    const data = block.data as Record<string, unknown>
    if (typeof data?.text === 'string') parts.push(stripTags(data.text))
    if (typeof data?.caption === 'string') parts.push(stripTags(data.caption))
    if (typeof data?.code === 'string') parts.push(data.code)
    if (Array.isArray(data?.items)) {
      for (const item of data.items as unknown[]) {
        if (typeof item === 'string') parts.push(stripTags(item))
        else if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>
          if (typeof rec.content === 'string') parts.push(stripTags(rec.content))
          if (typeof rec.text === 'string') parts.push(stripTags(rec.text))
        }
      }
    }
  }
  return parts.filter(Boolean).join(' ')
}

/**
 * Reading time. Thai has no word spacing, so character count is a far better
 * proxy than word count: ~400 Thai chars/min vs ~230 English words/min.
 */
export function readingMinutes(doc: EditorDocument): number {
  const text = documentToText(doc)
  if (!text) return 1
  const thaiChars = (text.match(/[฀-๿]/g) ?? []).length
  const latinWords = text.replace(/[฀-๿]/g, ' ').split(/\s+/).filter(Boolean).length
  const minutes = thaiChars / 400 + latinWords / 230
  return Math.max(1, Math.round(minutes))
}

/** First paragraph, trimmed — a sensible default summary. */
export function autoSummary(doc: EditorDocument, max = 180): string {
  const text = documentToText(doc)
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}
