'use client'

/**
 * Holds the window scroll position across a client-side navigation.
 *
 * Filtering, searching and paginating all change the URL, and Next resets the
 * scroll on navigation. `scroll: false` stops the reset to the very top but the
 * browser still shifts the viewport on its own (focus moves to the link that
 * was clicked, and the re-rendered tree re-anchors), so the position has to be
 * re-asserted for a few frames afterwards.
 *
 * A deliberate wheel or touch cancels the pin immediately, so this can never
 * fight a reader who decides to scroll while the results are updating.
 */
export function pinScroll(durationMs = 600) {
  if (typeof window === 'undefined') return

  const target = window.scrollY
  let cancelled = false

  const cancel = () => {
    cancelled = true
    detach()
  }
  const detach = () => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true, once: true })
  window.addEventListener('touchstart', cancel, { passive: true, once: true })

  const until = performance.now() + durationMs
  const tick = () => {
    if (cancelled) return
    if (Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target)
    if (performance.now() < until) requestAnimationFrame(tick)
    else detach()
  }
  requestAnimationFrame(tick)
}
