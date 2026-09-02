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

/**
 * Best-effort language guess for blocks saved before the picker existed.
 *
 * Ordered most-specific first. A wrong guess only costs the wrong palette; the
 * alternative — leaving older posts unhighlighted — is worse.
 */
export function detectLanguage(code: string): string {
  const text = code.trim()
  if (!text) return 'text'
  const first = text.split('\n')[0] ?? ''

  if (/^#!/.test(first)) return 'bash'
  if (/^(FROM|RUN|COPY|WORKDIR|ENTRYPOINT|CMD)\s/m.test(text)) return 'docker'
  if (/^\s*(model|datasource|generator)\s+\w+\s*\{/m.test(text)) return 'prisma'
  if (/^\s*[{[]/.test(text) && /"[^"]+"\s*:/.test(text)) return 'json'
  if (/^---\s*$/m.test(text) || (/^\s*[\w.-]+:\s*(\S|$)/m.test(text) && !/[;{}]/.test(text)))
    return 'yaml'
  if (/^\s*<[a-z!/]/i.test(text)) return 'html'
  if (/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE)\b/i.test(text))
    return 'sql'
  if (/\b(interface|type)\s+\w+\s*[={]|:\s*(string|number|boolean|void|Promise<)/.test(text))
    return 'typescript'
  if (/\b(fun|val|var)\s+\w+|suspend\s+fun|@Composable/.test(text)) return 'kotlin'
  if (/\b(def|elif)\s|^\s*from\s+\w+\s+import\s/m.test(text)) return 'python'
  if (/\b(import|export|const|let|function)\b|=>/.test(text)) return 'javascript'
  if (/^\s*[.#]?[\w-]+\s*\{[^}]*:[^}]*;/m.test(text)) return 'css'
  if (/^\s*[$#]\s|\b(npm|npx|yarn|pnpm|git|docker|sudo|curl|cd|mkdir|export)\s/m.test(text))
    return 'bash'

  return 'text'
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

      // Blocks saved before the language picker existed carry no language.
      const declared = normaliseLang(data.language)
      const language = declared === 'text' ? detectLanguage(code) : declared
      const html = await highlight(code, language)
      return { ...block, data: { ...data, language, highlighted: html } }
    }),
  )
}
