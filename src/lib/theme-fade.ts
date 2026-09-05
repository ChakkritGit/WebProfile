'use client'

/**
 * Crossing from one theme to the other.
 *
 * The palette lives in custom properties, and a custom property does not
 * animate — `--paper` going from cream to near-black is one assignment, not a
 * journey. What can animate is the properties that read them, so the fade is
 * turned on for every element for as long as the switch takes and turned off
 * again: see `.theme-fading` in `globals.css`.
 *
 * A class rather than the View Transitions API, which would cross-fade a
 * snapshot of the whole page more cheaply — but only in the browsers that have
 * it, and only by freezing the page for the duration. This works everywhere and
 * leaves the page live while it changes.
 */

const DURATION = 320

let timer: ReturnType<typeof setTimeout> | undefined

export function fadeTheme(apply: () => void) {
  const root = document.documentElement

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply()
    return
  }

  root.classList.add('theme-fading')
  apply()

  // Cleared and reset rather than stacked: pressing the button three times
  // quickly should leave one timer, not three, and the last one is the one that
  // knows when the last change finishes.
  clearTimeout(timer)
  timer = setTimeout(() => root.classList.remove('theme-fading'), DURATION + 60)
}
