import type { EditorBlock, EditorDocument } from './editor'
import { stripTags } from './editor'
import { uniqueSlug } from './slug'

export interface TocItem {
  id: string
  text: string
  level: number
}

export interface AnnotatedBlock extends EditorBlock {
  /** Present on heading blocks — the element id the TOC links to. */
  anchor?: string
}

export interface Outline {
  blocks: AnnotatedBlock[]
  toc: TocItem[]
}

const TOC_LEVELS = [2, 3, 4]

/**
 * Single pass that both annotates heading blocks with anchor ids and collects
 * the table of contents. The renderer and the TOC consume the same result, so
 * their ids can never drift apart.
 */
export function buildOutline(doc: EditorDocument): Outline {
  const taken = new Set<string>()
  const toc: TocItem[] = []

  const blocks: AnnotatedBlock[] = doc.blocks.map((block, index) => {
    if (block.type !== 'header') return block

    const data = block.data as { text?: string; level?: number }
    const text = stripTags(data.text ?? '')
    const level = typeof data.level === 'number' ? data.level : 2
    const anchor = uniqueSlug(text, taken, `section-${index + 1}`)

    if (TOC_LEVELS.includes(level) && text) {
      toc.push({ id: anchor, text, level })
    }
    return { ...block, anchor }
  })

  return { blocks, toc }
}
