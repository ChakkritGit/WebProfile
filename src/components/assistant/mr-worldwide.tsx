'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'

// Nothing of him is in the first load: the chunk is fetched once the page is idle.
const Assistant = dynamic(() => import('./assistant'), { ssr: false })

export function MrWorldwide() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(go, 2500)
    return () => clearTimeout(id)
  }, [])
  if (!ready || pathname.startsWith('/studio')) return null
  return <Assistant />
}
