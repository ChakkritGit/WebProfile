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
 * Restores whatever the body carried before rather than clearing the properties,
 * because two of these can overlap — a dialog opened from a page that already
 * locked.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [active])
}
