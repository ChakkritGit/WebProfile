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

function Heading({ block, align }: { block: AnnotatedBlock; align: string }) {
  const { text = '', level = 2 } = block.data as { text?: string; level?: number }
  const clamped = Math.min(6, Math.max(1, level))
  const Tag = `h${clamped}` as 'h2'

  return (
    <Tag
      id={block.anchor}
      className={cn('group scroll-mt-28 font-bold', headingStyles[clamped], align)}
    >
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

/** Reads the alignment block-tune, which the editor stores alongside the data. */
function alignmentOf(block: AnnotatedBlock): string {
  const tune = block.tunes?.alignment as { alignment?: string } | undefined
  const value = tune?.alignment ?? (block.data as { alignment?: string }).alignment
  if (value === 'center') return 'text-center'
  if (value === 'right') return 'text-end'
  if (value === 'justify') return 'text-justify'
  return ''
}

function Block({ block }: { block: AnnotatedBlock }) {
  const data = block.data as Record<string, unknown>

  switch (block.type) {
    case 'header':
      return <Heading block={block} align={alignmentOf(block)} />

    case 'paragraph':
      return (
        <p className={cn('my-4 leading-[1.85]', alignmentOf(block))}>
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
        <figure className={cn('sticker bg-violet-soft my-7 p-5 sm:p-6', alignmentOf(block))}>
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
      return (
        <CodeBlock
          code={String(data.code ?? '')}
          language={typeof data.language === 'string' ? data.language : undefined}
          highlighted={typeof data.highlighted === 'string' ? data.highlighted : null}
        />
      )

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

      // Editor.js image tunes. Only `stretched` was read here, so an author who
      // ticked "with background" or "with border" saw the change in the editor and
      // nothing at all on the published page.
      const stretched = Boolean(data.stretched)
      const withBackground = Boolean(data.withBackground)
      const withBorder = Boolean(data.withBorder)

      return (
        <figure className="my-8">
          <div
            className={cn(
              'sticker relative overflow-hidden',
              withBackground ? 'bg-surface-2 p-4 sm:p-8' : 'bg-surface',
              stretched && '-mx-4 sm:-mx-8',
            )}
          >
            <Image
              src={url}
              alt={caption || ''}
              width={file.width ?? 1280}
              height={file.height ?? 720}
              // Same reason as the cover: `data.url` can point at a host the
              // optimiser is not allowed to fetch.
              unoptimized
              className={cn(
                'h-auto w-full',
                withBackground && 'mx-auto max-w-[85%] rounded-xl sm:max-w-[70%]',
                withBorder && 'border-line rounded-xl border-2',
              )}
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
      if (!link) return null

      const meta = (data.meta ?? {}) as {
        title?: string
        description?: string
        site_name?: string
        image?: { url?: string }
      }
      const image = meta.image?.url
      let host = meta.site_name ?? link
      try {
        host = new URL(link).hostname.replace(/^www\./, '')
      } catch {
        // Keep the raw link if it isn't parseable.
      }

      return (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="sticker sticker-hover bg-surface my-7 flex items-stretch gap-0 overflow-hidden no-underline"
        >
          <span className="min-w-0 flex-1 p-4 sm:p-5">
            <span className="text-brand font-display block truncate text-xs font-bold tracking-wide uppercase">
              {host}
            </span>
            <span className="font-display mt-1.5 block font-bold leading-snug">
              {meta.title || link}
            </span>
            {meta.description && (
              <span className="text-muted mt-1.5 line-clamp-2 block text-sm leading-relaxed">
                {meta.description}
              </span>
            )}
          </span>

          {image && (
            <span className="border-line relative hidden w-40 shrink-0 border-s-2 sm:block">
              {/* Unoptimised: previews point at arbitrary hosts that are not in
                  next.config's remotePatterns allow-list. */}
              <Image
                src={image}
                alt=""
                width={320}
                height={320}
                unoptimized
                className="absolute inset-0 size-full object-cover"
              />
            </span>
          )}
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

    case 'alert': {
      const tones: Record<string, string> = {
        primary: 'bg-sky-soft',
        secondary: 'bg-surface-2',
        info: 'bg-sky-soft',
        success: 'bg-mint-soft',
        warning: 'bg-sun-soft',
        danger: 'bg-brand-soft',
        light: 'bg-surface',
        dark: 'bg-surface-2',
      }
      const tone = tones[String(data.type ?? 'primary')] ?? 'bg-sky-soft'
      const align = data.align === 'center' ? 'text-center' : data.align === 'right' ? 'text-end' : ''
      return (
        <aside className={cn('sticker my-7 p-5', tone, align)} role="note">
          <RichText html={String(data.message ?? '')} />
        </aside>
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
