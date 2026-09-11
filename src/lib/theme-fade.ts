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
 * The list of properties is the whole trick. It used to name only
 * background-color, border-color, color, fill and stroke, so everything else
 * changed instantly underneath the fade: the grid, which is a background *image*
 * of two gradients, and every sticker shadow. Half the page crossfading over
 * 320ms while the other half snapped is what "not smooth" was — it was never
 * dropped frames, which measured none at full speed.
 *
 * Not the View Transitions API: it does arrive all at once, but it freezes the
 * page to do it. Measured here, one 417ms frame, which the stars and the meteors
 * spend standing still.
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
