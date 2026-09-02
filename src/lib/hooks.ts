'use client'

import { useSyncExternalStore } from 'react'

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
