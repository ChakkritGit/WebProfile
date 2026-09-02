import { Fragment, type ReactNode } from 'react'

/**
 * Editor.js inline tools emit a small, known subset of HTML (bold, italic,
 * marker, inline code, links…). Rather than trusting it with
 * `dangerouslySetInnerHTML`, we tokenise that subset into React elements and
 * escape everything else. Unknown tags are dropped but their text is kept, and
 * link hrefs are restricted to safe schemes — so a stray `<script>` or
 * `javascript:` URL in stored content can never execute.
 */

const ALLOWED = {
  b: 'strong',
  strong: 'strong',
  i: 'em',
  em: 'em',
  u: 'u',
  s: 's',
  del: 's',
  mark: 'mark',
  code: 'code',
  a: 'a',
} as const

type AllowedTag = keyof typeof ALLOWED

const VOID_TAGS = new Set(['br'])
const SAFE_SCHEME = /^(https?:|mailto:|tel:|#|\/)/i

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase()
    if (ENTITIES[key]) return ENTITIES[key]
    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return match
  })
}

function getAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))
  if (!match) return null
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '')
}

const classFor: Partial<Record<AllowedTag, string>> = {
  mark: 'bg-sun-soft rounded px-1 py-0.5 box-decoration-clone',
  code: 'bg-surface-2 border-line-soft rounded-md border px-1.5 py-0.5 font-mono text-[0.92em] font-medium',
  a: 'text-brand font-medium underline decoration-2 underline-offset-2 hover:decoration-[3px]',
}

const TAG_RE = /<\/?([a-z][a-z0-9]*)((?:\s[^>]*)?)\/?>/gi

interface Frame {
  tag: AllowedTag | null
  attrs: string
  children: ReactNode[]
}

export function parseInlineHtml(input: string): ReactNode[] {
  if (!input) return []

  const stack: Frame[] = [{ tag: null, attrs: '', children: [] }]
  let cursor = 0
  let key = 0

  const pushText = (text: string) => {
    if (!text) return
    stack[stack.length - 1].children.push(
      <Fragment key={key++}>{decodeEntities(text)}</Fragment>,
    )
  }

  const closeFrame = () => {
    const frame = stack.pop()
    if (!frame || !frame.tag) return
    const parent = stack[stack.length - 1]
    const Tag = ALLOWED[frame.tag]
    const className = classFor[frame.tag]

    if (Tag === 'a') {
      const href = getAttr(frame.attrs, 'href')
      // Unsafe or missing href → keep the text, drop the link.
      if (!href || !SAFE_SCHEME.test(href.trim())) {
        parent.children.push(<Fragment key={key++}>{frame.children}</Fragment>)
        return
      }
      const external = /^https?:/i.test(href)
      parent.children.push(
        <a
          key={key++}
          href={href}
          className={className}
          {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        >
          {frame.children}
        </a>,
      )
      return
    }

    parent.children.push(
      <Tag key={key++} className={className}>
        {frame.children}
      </Tag>,
    )
  }

  for (let match = TAG_RE.exec(input); match; match = TAG_RE.exec(input)) {
    pushText(input.slice(cursor, match.index))
    cursor = TAG_RE.lastIndex

    const raw = match[0]
    const name = match[1].toLowerCase()
    const attrs = match[2] ?? ''
    const isClosing = raw.startsWith('</')

    if (VOID_TAGS.has(name)) {
      stack[stack.length - 1].children.push(<br key={key++} />)
      continue
    }

    if (!(name in ALLOWED)) continue // drop the tag, keep its text content

    if (isClosing) {
      // Only close if this tag is actually open, so stray closers are ignored.
      if (stack.some((frame) => frame.tag === name)) {
        while (stack.length > 1 && stack[stack.length - 1].tag !== name) closeFrame()
        if (stack.length > 1) closeFrame()
      }
      continue
    }

    stack.push({ tag: name as AllowedTag, attrs, children: [] })
  }

  pushText(input.slice(cursor))
  while (stack.length > 1) closeFrame()

  return stack[0].children
}

export function RichText({ html }: { html: string }) {
  return <>{parseInlineHtml(html)}</>
}
