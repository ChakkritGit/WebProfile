import type { ReactNode } from 'react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/section'
import { TagLink } from './tag-link'
import { BlockRenderer } from './block-renderer'
import { TableOfContents } from './table-of-contents'
import { ShareBar } from './share-bar'
import { buildOutline } from '@/lib/toc'
import { highlightBlocks } from '@/lib/highlight'
import type { EditorDocument } from '@/lib/editor'
import { ArrowRightIcon } from '@/components/icons'

/**
 * Shared reading layout for posts and projects: a measured content column with
 * a sticky table of contents on the right (collapsing above the article on
 * small screens).
 */
export async function ArticleShell({
  title,
  content,
  meta,
  tags,
  aside,
  backHref,
  backLabelKey,
  shareUrl,
  coverImage,
}: {
  title: string
  content: EditorDocument
  meta?: ReactNode
  tags?: string[]
  aside?: ReactNode
  backHref: string
  backLabelKey: 'blog' | 'projects'
  shareUrl: string
  /** Optional cover art, bled into the right of the header. */
  coverImage?: string | null
}) {
  const t = await getTranslations('common')
  const tNav = await getTranslations('nav')
  const { blocks: outlineBlocks, toc } = buildOutline(content)
  const blocks = await highlightBlocks(outlineBlocks)

  return (
    <article className="pb-16">
      <div className="drawn-rule paper-grain bg-paper-alt relative overflow-hidden">
        {coverImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 w-3/5 sm:w-3/5 lg:w-1/2"
          >
            {/* Unoptimised: covers may point at hosts outside next.config's
                remotePatterns allow-list. */}
            <Image src={coverImage} alt="" fill unoptimized className="object-cover" priority />
            {/* Fades the art into the page toward the text so the heading keeps
                its contrast at any image brightness. */}
            {/* Narrow screens have no room for the art to sit beside the text, so
                the wash covers the whole panel and reads as a tint. Desktop has
                the room, so the fade is pulled into the first third and the rest
                of the picture is left alone — spreading it further washed the
                cover out to the point of being unreadable. */}
            <div className="from-paper-alt via-paper-alt/92 via-50% to-paper-alt/45 sm:via-paper-alt/55 sm:via-30% sm:to-transparent sm:to-78% absolute inset-0 bg-gradient-to-r" />
            <div className="from-paper-alt to-transparent sm:to-35% absolute inset-0 bg-gradient-to-t" />
          </div>
        )}

        <Container className="relative z-10 py-10 sm:py-14">
          <Link
            href={backHref}
            className="text-muted hover:text-brand font-display mb-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
            {t('backTo', { page: tNav(backLabelKey) })}
          </Link>

          <h1 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl">{title}</h1>

          {meta && <div className="text-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">{meta}</div>}

          {tags && tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag}>
                  <TagLink tag={tag} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>

      <Container className="pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <div className="min-w-0">
            {/* Mobile TOC sits above the article; the desktop rail is in the sidebar. */}
            {toc.length > 0 && (
              <div className="mb-6 lg:hidden">
                <TableOfContents items={toc} />
              </div>
            )}

            {aside}

            <BlockRenderer blocks={blocks} />

            <ShareBar url={shareUrl} title={title} />
          </div>

          {/* self-start stops the grid stretching the column, which is what
              lets the sticky offset actually travel with the scroll. */}
          <aside className="hidden lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:block lg:self-start">
            <TableOfContents items={toc} />
          </aside>
        </div>
      </Container>
    </article>
  )
}
