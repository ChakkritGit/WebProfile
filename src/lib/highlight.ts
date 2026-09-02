import 'server-only'

import { createHighlighter, type Highlighter } from 'shiki'
import type { AnnotatedBlock } from './toc'

/**
 * Server-side syntax highlighting.
 *
 * Runs during render so no highlighter ships to the browser. A curated language
 * set keeps the bundle honest — `codeToHtml` from the shiki entrypoint would
 * pull in every grammar and theme.
 */

const LANGS = [
  'bash', 'shell', 'json', 'yaml', 'typescript', 'javascript', 'tsx', 'jsx',
  'html', 'css', 'sql', 'python', 'kotlin', 'java', 'dart', 'go', 'rust',
  'php', 'markdown', 'diff', 'docker', 'ini', 'xml', 'prisma',
] as const

export type CodeLanguage = (typeof LANGS)[number] | 'text'

const ALIASES: Record<string, string> = {
  sh: 'bash', zsh: 'bash', console: 'bash', shellsession: 'bash',
  ts: 'typescript', js: 'javascript', yml: 'yaml', py: 'python',
  dockerfile: 'docker', md: 'markdown', kt: 'kotlin', plaintext: 'text', txt: 'text',
}

export function normaliseLang(input: unknown): string {
  const raw = String(input ?? '').trim().toLowerCase()
  if (!raw) return 'text'
  const mapped = ALIASES[raw] ?? raw
  return (LANGS as readonly string[]).includes(mapped) ? mapped : 'text'
}

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  // One instance per server process; creating it per request is expensive.
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark-default'],
    langs: [...LANGS],
  })
  return highlighterPromise
}

/** Highlighted markup, or `null` when the language is unknown/plain. */
export async function highlight(code: string, language: string): Promise<string | null> {
  const lang = normaliseLang(language)
  if (lang === 'text') return null

  try {
    const highlighter = await getHighlighter()
    return highlighter.codeToHtml(code, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark-default' },
      // Emits --shiki-light / --shiki-dark custom properties instead of baking
      // one theme in, so the page's own theme toggle drives the colours.
      defaultColor: false,
    })
  } catch {
    // An unsupported grammar should degrade to plain text, not break the page.
    return null
  }
}

/**
 * Pre-renders every code block's markup so the (synchronous) block renderer can
 * stay a plain function.
 */
export async function highlightBlocks(blocks: AnnotatedBlock[]): Promise<AnnotatedBlock[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type !== 'code') return block
      const data = block.data as { code?: string; language?: string }
      const code = String(data.code ?? '')
      if (!code.trim()) return block

      const language = normaliseLang(data.language)
      const html = await highlight(code, language)
      return { ...block, data: { ...data, language, highlighted: html } }
    }),
  )
}
