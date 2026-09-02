import Image from 'next/image'
import type { AnnotatedBlock } from '@/lib/toc'
import { cn } from '@/lib/utils'
import { RichText } from './rich-text'
import { CodeBlock } from './code-block'
import { DelimiterMark } from '@/components/icons'

/* --------------------------- block data shapes -------------------------- */

interface ListItem {
  content?: string
  text?: string
  items?: ListItem[]
  meta?: { checked?: boolean }
}

const headingStyles: Record<number, string> = {
  1: 'text-3xl sm:text-4xl mt-12 mb-4',
  2: 'text-2xl sm:text-3xl mt-12 mb-4',
  3: 'text-xl sm:text-2xl mt-9 mb-3',
  4: 'text-lg sm:text-xl mt-7 mb-2',
  5: 'text-base sm:text-lg mt-6 mb-2',
  6: 'text-base mt-6 mb-2',
}

function Heading({ block }: { block: AnnotatedBlock }) {
  const { text = '', level = 2 } = block.data as { text?: string; level?: number }
  const clamped = Math.min(6, Math.max(1, level))
  const Tag = `h${clamped}` as 'h2'

  return (
    <Tag id={block.anchor} className={cn('group scroll-mt-28 font-bold', headingStyles[clamped])}>
      <span>
        <RichText html={text} />
      </span>
      {block.anchor && (
        <a
          href={`#${block.anchor}`}
          aria-label={`Link to section`}
          tabIndex={-1}
          className="text-brand ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          #
        </a>
      )}
    </Tag>
  )
}

function NestedList({ items, ordered, depth = 0 }: { items: ListItem[]; ordered: boolean; depth?: number }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag
      className={cn(
        'my-4 space-y-2 ps-6',
        ordered ? 'list-decimal marker:font-display marker:font-bold' : 'list-none',
        depth > 0 && 'my-2',
      )}
    >
      {items.map((item, i) => {
        const content = item.content ?? item.text ?? ''
        return (
          <li key={i} className={cn('relative', !ordered && 'ps-5')}>
            {!ordered && (
              <span
                aria-hidden
                className="bg-brand absolute start-0 top-[0.6em] size-2 rounded-full"
              />
            )}
            <RichText html={content} />
            {item.items && item.items.length > 0 && (
              <NestedList items={item.items} ordered={ordered} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </Tag>
  )
}

function Checklist({ items }: { items: ListItem[] }) {
  return (
    <ul className="my-5 space-y-2.5">
      {items.map((item, i) => {
        const checked = item.meta?.checked ?? (item as { checked?: boolean }).checked ?? false
        return (
          <li key={i} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'border-line mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2',
                checked ? 'bg-mint text-ink' : 'bg-surface',
              )}
            >
              {checked && (
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4.5 12.5 5 5 10-11" />
                </svg>
              )}
            </span>
            <span className={cn(checked && 'text-muted line-through')}>
              <RichText html={item.text ?? item.content ?? ''} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------- renderer ------------------------------- */

function Block({ block }: { block: AnnotatedBlock }) {
  const data = block.data as Record<string, unknown>

  switch (block.type) {
    case 'header':
      return <Heading block={block} />

    case 'paragraph':
      return (
        <p className="my-4 leading-[1.85]">
          <RichText html={String(data.text ?? '')} />
        </p>
      )

    case 'list': {
      const items = (data.items ?? []) as ListItem[]
      if (data.style === 'checklist') return <Checklist items={items} />
      return <NestedList items={items} ordered={data.style === 'ordered'} />
    }

    case 'checklist':
      return <Checklist items={(data.items ?? []) as ListItem[]} />

    case 'quote':
      return (
        <figure className="sticker bg-violet-soft my-7 p-5 sm:p-6">
          <blockquote className="font-display text-lg leading-relaxed font-medium">
            <RichText html={String(data.text ?? '')} />
          </blockquote>
          {data.caption ? (
            <figcaption className="text-muted mt-3 text-sm">
              — <RichText html={String(data.caption)} />
            </figcaption>
          ) : null}
        </figure>
      )

    case 'code':
      return <CodeBlock code={String(data.code ?? '')} />

    case 'delimiter':
      return (
        <div aria-hidden className="my-10 flex justify-center">
          <DelimiterMark className="text-brand h-4 w-24" />
        </div>
      )

    case 'table': {
      const rows = (data.content ?? []) as string[][]
      if (rows.length === 0) return null
      const withHeadings = Boolean(data.withHeadings)
      const [first, ...rest] = rows
      const body = withHeadings ? rest : rows

      return (
        <div className="sticker bg-surface my-7 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {withHeadings && (
              <thead>
                <tr className="bg-surface-2">
                  {first.map((cell, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-line-soft font-display border-b-2 px-4 py-3 text-start font-bold"
                    >
                      <RichText html={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, r) => (
                <tr key={r} className="border-line-soft [&:not(:last-child)]:border-b">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-3 align-top">
                      <RichText html={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'image': {
      const file = (data.file ?? {}) as { url?: string; width?: number; height?: number }
      const url = String(file.url ?? data.url ?? '')
      if (!url) return null
      const caption = String(data.caption ?? '')

      return (
        <figure className="my-8">
          <div
            className={cn(
              'sticker bg-surface relative overflow-hidden',
              Boolean(data.stretched) && '-mx-4 sm:-mx-8',
            )}
          >
            <Image
              src={url}
              alt={caption || ''}
              width={file.width ?? 1280}
              height={file.height ?? 720}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          {caption ? (
            <figcaption className="text-muted mt-3 text-center text-sm">
              <RichText html={caption} />
            </figcaption>
          ) : null}
        </figure>
      )
    }

    case 'linkTool': {
      const link = String(data.link ?? '')
      const meta = (data.meta ?? {}) as { title?: string; description?: string; image?: { url?: string } }
      if (!link) return null
      return (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="sticker sticker-hover bg-surface my-7 flex items-center gap-4 overflow-hidden p-4 no-underline"
        >
          <span className="min-w-0 flex-1">
            <span className="font-display block truncate font-bold">{meta.title || link}</span>
            {meta.description && (
              <span className="text-muted mt-1 line-clamp-2 block text-sm">{meta.description}</span>
            )}
            <span className="text-brand mt-1 block truncate text-xs">{link}</span>
          </span>
        </a>
      )
    }

    case 'embed': {
      const embed = String(data.embed ?? '')
      if (!embed) return null
      return (
        <figure className="my-8">
          <div className="sticker bg-surface relative aspect-video overflow-hidden">
            <iframe
              src={embed}
              title={String(data.caption ?? 'Embedded content')}
              loading="lazy"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          </div>
          {data.caption ? (
            <figcaption className="text-muted mt-3 text-center text-sm">
              <RichText html={String(data.caption)} />
            </figcaption>
          ) : null}
        </figure>
      )
    }

    case 'warning':
      return (
        <aside className="sticker bg-sun-soft my-7 p-5">
          <p className="font-display font-bold">
            <RichText html={String(data.title ?? '')} />
          </p>
          <p className="mt-1">
            <RichText html={String(data.message ?? '')} />
          </p>
        </aside>
      )

    default:
      // Unknown block types are skipped rather than crashing the page — new
      // Editor.js tools can be added without breaking already-published posts.
      return null
  }
}

export function BlockRenderer({ blocks }: { blocks: AnnotatedBlock[] }) {
  return (
    <div className="text-ink text-[1.02rem]">
      {blocks.map((block, i) => (
        <Block key={block.id ?? i} block={block} />
      ))}
    </div>
  )
}
