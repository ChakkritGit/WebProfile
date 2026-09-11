'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslations } from 'next-intl'
import { ChevronDownIcon, ListIcon } from '@/components/icons'
import type { TocItem } from '@/lib/toc'
import { cn } from '@/lib/utils'

const INDENT: Record<number, string> = { 2: 'ps-0', 3: 'ps-4', 4: 'ps-8' }

/**
 * Sticky right-hand table of contents with scroll spy.
 *
 * The observer's rootMargin creates a band near the top of the viewport; the
 * heading closest to the top of that band wins. This avoids the classic bug
 * where the last section never highlights because it can't reach the middle of
 * the screen — we also force the final item active once the page is scrolled
 * to the bottom.
 */
/**
 * Reading progress drawn as a squiggle instead of a filled bar.
 *
 * One SVG holds both states: the pale line is the whole path, the brand-coloured
 * one is the same path clipped with `inset()`. Clipping rather than resizing keeps
 * the wave the same size as it fills — a width-driven fill would have stretched
 * every crest as the reader moved down the page.
 */
function ReadingSquiggle({ progress }: { progress: number }) {
  const WAVE =
    'M3 7.5q5.5 -5.4 11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0t11 0'
  return (
    <svg
      viewBox="0 0 200 15"
      preserveAspectRatio="none"
      aria-hidden
      className="text-brand mb-3 h-3.5 w-full"
    >
      <path d={WAVE} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.2" />
      <path
        d={WAVE}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          transition: 'clip-path 150ms linear',
        }}
      />
    </svg>
  )
}

export function TableOfContents({ items, className }: { items: TocItem[]; className?: string }) {
  const t = useTranslations('common')
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const visible = useRef(new Map<string, number>())

  useEffect(() => {
    if (items.length === 0) return
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.current.set(entry.target.id, entry.intersectionRatio)
          else visible.current.delete(entry.target.id)
        }
        // Pick the first heading (in document order) currently in the band.
        const first = items.find((item) => visible.current.has(item.id))
        if (first) setActiveId(first.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] },
    )

    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const ratio = scrollable > 0 ? doc.scrollTop / scrollable : 0
      setProgress(Math.min(1, Math.max(0, ratio)))
      // At the very bottom, the last section is what the reader is looking at.
      if (ratio > 0.985 && items.length > 0) setActiveId(items[items.length - 1].id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  const jumpTo = useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    const target = document.getElementById(id)
    if (!target) return

    /**
     * Collapse first, then aim.
     *
     * On a phone this list sits *above* the article, so closing it moves every
     * heading up by its own height — and it was being closed after the scroll
     * had already been aimed at where the heading used to be. Measured on a
     * 390px viewport: the panel was 560px tall and the heading ended up 577px
     * above the top of the screen. `flushSync` is what makes the layout true
     * before the browser is asked where to go, rather than hoping a frame is
     * enough.
     */
    flushSync(() => setOpen(false))

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })

    /**
     * Check the landing, because the page moves while the scroll is in flight.
     *
     * Pictures between here and there load on the way past and settle at their
     * real height, and the heading goes with them: measured on a phone, 17px
     * above the top of the screen, under the header. The aim is checked once the
     * scroll has stopped and corrected if it is out — but only within a screen of
     * where it should be, so that a reader who grabbed the page mid-flight and
     * went somewhere else is not dragged back.
     */
    const settle = () => {
      window.clearTimeout(fallback)
      const wanted = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const off = target.getBoundingClientRect().top - wanted
      if (Math.abs(off) > 2 && Math.abs(off) < window.innerHeight) window.scrollBy({ top: off })
    }
    // `scrollend` is the signal; the timer is for the browsers without it.
    window.addEventListener('scrollend', settle, { once: true })
    const fallback = window.setTimeout(settle, 1200)
    // Keep the URL shareable and move focus for screen-reader/keyboard users.
    history.replaceState(null, '', `#${id}`)
    target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    setActiveId(id)
  }, [])

  if (items.length === 0) return null

  const list = (
    <ol className="space-y-1">
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <li key={item.id} className={INDENT[item.level] ?? 'ps-8'}>
            <a
              href={`#${item.id}`}
              onClick={(event) => jumpTo(event, item.id)}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'block rounded-s-none rounded-e-lg px-3 py-1.5 text-sm transition-colors',
                'border-s-2',
                active
                  ? 'border-brand bg-brand-soft text-ink font-semibold'
                  : 'text-muted hover:text-ink border-transparent hover:border-[var(--line-soft)]',
              )}
            >
              {item.text}
            </a>
          </li>
        )
      })}
    </ol>
  )

  return (
    <>
      {/* Desktop: sticky rail */}
      <nav aria-label={t('tableOfContents')} className={cn('hidden min-h-0 lg:flex lg:flex-col', className)}>
        <div className="sticker bg-surface flex min-h-0 flex-col p-4">
            <p className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
              <ListIcon className="size-4" />
              {t('tableOfContents')}
            </p>
            <ReadingSquiggle progress={progress} />
          {/* The height comes from the column now, not a hand-computed max: the
              sibling card below it has to fit too. */}
          <div className="min-h-0 flex-1 overflow-y-auto pe-1">{list}</div>
        </div>
      </nav>

      {/* Mobile: collapsible */}
      <nav aria-label={t('tableOfContents')} className="lg:hidden">
        <div className="sticker bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="font-display flex w-full items-center gap-2 px-4 py-3 text-sm font-bold tracking-wide uppercase"
          >
            <ListIcon className="size-4" />
            {t('tableOfContents')}
            <ChevronDownIcon
              aria-hidden
              className={cn('ms-auto size-4 transition-transform', open && 'rotate-180')}
            />
          </button>
          {/* More room above the first item than below the last: the drawn rule
              is a hand-made line with its own thickness, and the active item's
              filled box was sitting right under it. */}
          {open && <div className="drawn-rule-top relative px-3 pt-5 pb-3">{list}</div>}
        </div>
      </nav>
    </>
  )
}
