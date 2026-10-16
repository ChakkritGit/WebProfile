'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * True only after hydration. `useSyncExternalStore` gives the server snapshot
 * (`false`) and the client snapshot (`true`) without a setState-in-effect,
 * which is the modern replacement for the `useState`+`useEffect` mount flag.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

/** Whether the page is scrolled past `threshold` pixels. */
export function useScrolledPast(threshold: number): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  )
}

/**
 * Whether the footer has risen into the bottom band of the screen.
 *
 * The floating controls use this to stand down at the foot of the page, where
 * the footer carries the same links and its own back-to-top button and they
 * would only be sitting on top of them.
 *
 * Measured against the footer rather than the document height, so it does not
 * need to know how tall a given page's footer is. `narrow` covers controls that
 * change shape below the `sm` breakpoint: one band for both hid the contact dock
 * a third of the way up a phone, long before anything was in its way.
 */
export function useAtFooter(band: number, narrow = band): boolean {
  const [atFooter, setAtFooter] = useState(false)

  useEffect(() => {
    const check = () => {
      const footer = document.querySelector('footer')
      if (!footer) return
      const reach = window.innerWidth >= 640 ? band : narrow
      setAtFooter(footer.getBoundingClientRect().top < window.innerHeight - reach)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [band, narrow])

  return atFooter
}

/**
 * Holds the page still while something is on top of it.
 *
 * A preview that fills the screen still leaves the document behind it scrollable:
 * measured on an article, opening the image lightbox and turning the wheel moved
 * the page 700px underneath, and the graph did the same expanded. The scrollbar's
 * width is padded back on so the page does not shift sideways as it disappears.
 *
 * The body is pinned with `position: fixed` at minus the scroll offset, and the
 * offset is scrolled back to on release. `overflow: hidden` was not a lock on
 * iOS Safari: the page moved under an open picture (1781 → 1530 px measured in
 * WebKit) and, on a phone, closing the picture left the article at the very top.
 * No `overflow: hidden` with it: that makes the body the sticky header's scroll
 * container, and the header rode up off the screen with the pinned page.
 *
 * Counted, because two of these can overlap - a dialog opened from a page that
 * already locked: the first one in pins the page, the last one out lets it go.
 */
let locks = 0
let saved: { y: number; style: Partial<CSSStyleDeclaration> } | null = null

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    if (locks++ === 0) {
      const body = document.body.style
      const y = window.scrollY
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      saved = {
        y,
        style: {
          position: body.position,
          top: body.top,
          left: body.left,
          right: body.right,
          width: body.width,
          paddingRight: body.paddingRight,
        },
      }
      body.position = 'fixed'
      body.top = `-${y}px`
      body.left = '0'
      body.right = '0'
      body.width = '100%'
      if (scrollbar > 0) body.paddingRight = `${scrollbar}px`
    }

    return () => {
      if (--locks > 0 || !saved) return
      Object.assign(document.body.style, saved.style)
      // `instant`: back where the reader was, not a visible scroll from the top.
      window.scrollTo({ top: saved.y, left: 0, behavior: 'instant' })
      saved = null
    }
  }, [active])
}
