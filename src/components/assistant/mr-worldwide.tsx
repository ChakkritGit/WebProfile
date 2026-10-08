'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'

// Nothing of him is in the first load. The chunk is fetched on the visitor's
// first move, touch, scroll or key - or after 12 s without one. Loading on idle
// alone still landed inside the page's first seconds: three.js and his shaders
// took Lighthouse desktop from 0.96 to 0.89 (TBT 0 → 90 ms).
const Globe = dynamic(() => import('./assistant'), { ssr: false })
const Scroll = dynamic(() => import('./scroll-assistant'), { ssr: false })
const WAKE = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown'] as const

/**
 * Which of him answers: the paper scroll (SVG and CSS), or the original amber
 * globe (three.js). The globe is switched off, not removed: set this to true to
 * bring him back. His engine, stage and styles are left as they were.
 */
const SHOW_GLOBE = false

export function MrWorldwide() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    WAKE.forEach((e) => addEventListener(e, go, { once: true, passive: true }))
    const id = setTimeout(go, 12000)
    return () => {
      WAKE.forEach((e) => removeEventListener(e, go))
      clearTimeout(id)
    }
  }, [])
  // The home page only: on an article, a project or the studio he walked across what
  // people came to read. The pathname is locale-free, so '/' is home in every language.
  if (!ready || pathname !== '/') return null
  return SHOW_GLOBE ? <Globe /> : <Scroll />
}
