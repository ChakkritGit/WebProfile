'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'

// Nothing of him is in the first load. The chunk is fetched on the visitor's
// first move, touch, scroll or key — or after 12 s without one. Loading on idle
// alone still landed inside the page's first seconds: three.js and his shaders
// took Lighthouse desktop from 0.96 to 0.89 (TBT 0 → 90 ms).
const Assistant = dynamic(() => import('./assistant'), { ssr: false })
const WAKE = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown'] as const

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
  if (!ready || pathname.startsWith('/studio')) return null
  return <Assistant />
}
