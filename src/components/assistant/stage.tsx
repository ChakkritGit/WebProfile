'use client'

import { useEffect, useRef, useState } from 'react'
import land from '@/assets/ai/land.png'
import { createEngine, type Engine } from './engine/engine'

const DOCK_PX = 72 // the quick-contact dock's column at the right (quick-contact.tsx)

function webgl() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

export default function Stage({ onReady, onOpen, busy }: { onReady(e: Engine | null): void; onOpen(): void; busy: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const [fallback, setFallback] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const el = canvas.current
    if (!el || !webgl()) {
      // Decided once, in the browser: WebGL cannot be known on the server.
      setFallback(true)
      onReady(null)
      return
    }
    const mobile = matchMedia('(max-width: 639px)')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const e = createEngine(el, land.src, { mobile: mobile.matches, reducedMotion: reduce.matches, rightReserve: DOCK_PX })
    engine.current = e
    onReady(e)
    const opts = () => e.setOptions({ mobile: mobile.matches, reducedMotion: reduce.matches })
    mobile.addEventListener('change', opts)
    reduce.addEventListener('change', opts)

    // The canvas never takes clicks unless the pointer is over him.
    const move = (ev: PointerEvent) => {
      e.setPointer(ev.clientX, ev.clientY)
      const over = e.hitTest(ev.clientX, ev.clientY)
      el.style.pointerEvents = over ? 'auto' : 'none'
      el.style.cursor = over ? 'pointer' : ''
    }
    const leave = () => e.clearPointer()
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)

    // Phones: out of the way while scrolling down, back when it stops.
    let lastY = scrollY, timer = 0
    const scroll = () => {
      if (!mobile.matches) return
      if (scrollY > lastY + 4) setHidden(true)
      lastY = scrollY
      clearTimeout(timer)
      timer = window.setTimeout(() => setHidden(false), 600)
    }
    addEventListener('scroll', scroll, { passive: true })
    return () => {
      removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      removeEventListener('scroll', scroll)
      mobile.removeEventListener('change', opts)
      reduce.removeEventListener('change', opts)
      clearTimeout(timer)
      e.dispose()
      engine.current = null
      onReady(null)
    }
    // The engine is made once; the callbacks are stable setters from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => engine.current?.setBusy(busy), [busy])

  const open = () => {
    engine.current?.wave()
    onOpen()
  }

  if (fallback) {
    return (
      <button type="button" onClick={onOpen} aria-label="Mr. Worldwide" className="mw-fallback fixed bottom-4 left-4 z-30 grid size-12 place-items-center rounded-full">
        <span aria-hidden>🌍</span>
      </button>
    )
  }
  return (
    <canvas
      ref={canvas}
      role="button"
      tabIndex={0}
      aria-label="Mr. Worldwide — ask about this site"
      onClick={open}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          open()
        }
      }}
      className={`mw-stage pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[300px] w-full transition-transform duration-300 max-sm:h-[210px] ${hidden ? 'translate-y-full' : ''}`}
    />
  )
}
