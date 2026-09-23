'use client'

/**
 * Crossing from one theme to the other.
 *
 * With the View Transitions API: the browser snapshots the page, the theme
 * changes underneath, and the two pictures crossfade on the compositor. Every
 * pixel moves together — pseudo-elements, scrollbars, the orb's inline
 * opacities, form controls — because it is one image fading into another
 * rather than two hundred elements each transitioning its own colours while
 * the header re-blurs behind them every frame.
 *
 * It was passed over once, when the home page had twinkling stars and
 * meteors: the snapshot froze them for a 417ms frame. Those are gone.
 *
 * Where the API is missing, the older way: turn a colour transition on for
 * every element for as long as the switch takes (`.theme-fading` in
 * `globals.css`).
 */

const DURATION = 320

let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Resolves once `<html>`'s class changes — which is when next-themes has
 * actually applied the theme. `setTheme` only sets state; the class lands in
 * an effect a moment later, and a view transition snapshots the "after" state
 * as soon as its callback settles, so it has to wait for that.
 */
function classChange(root: HTMLElement): Promise<void> {
  const before = root.className
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (root.className === before) return
      observer.disconnect()
      resolve()
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    // Choosing "system" while the system already matches changes no class.
    setTimeout(() => {
      observer.disconnect()
      resolve()
    }, 150)
  })
}

export function fadeTheme(apply: () => void) {
  const root = document.documentElement

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply()
    return
  }

  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(() => {
      const applied = classChange(root)
      apply()
      return applied
    })
    return
  }

  root.classList.add('theme-fading')
  apply()

  // Cleared and reset rather than stacked: pressing the button three times
  // quickly should leave one timer, not three.
  clearTimeout(timer)
  timer = setTimeout(() => root.classList.remove('theme-fading'), DURATION + 60)
}
