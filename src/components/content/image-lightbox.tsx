'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CloseIcon } from '@/components/icons'

/**
 * Opening a picture in an article.
 *
 * One listener on the article rather than a wrapper round every image: the
 * renderer is a server component, and turning it into a client one to attach a
 * click handler would ship the whole block tree to the browser to gain nothing
 * else. The images carry `data-zoom`; this finds them by delegation.
 *
 * A native `<dialog>` does the rest — the top layer, the backdrop, Escape, and
 * returning focus to the image on close, none of which has to be written here.
 *
 * Zoom is one transform with three ways in, because the devices ask
 * differently: a tap toggles between fit and 2.5×, a wheel or trackpad pinch arrives as `wheel` with `ctrlKey` set,
 * and a touch pinch as two pointers whose distance changes. Panning is a drag
 * once the picture is larger than the screen; below that there is nothing to
 * pan to and the drag is ignored.
 */

const MIN = 1
const MAX = 6

type Shot = { src: string; alt: string }

export function ImageLightbox() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [shot, setShot] = useState<Shot | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Live pointers, for the two-finger pinch. A ref rather than state: these
  // change on every move and none of it should cause a render on its own.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; scale: number } | null>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    pointers.current.clear()
    pinch.current = null
    drag.current = null
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const image = (event.target as HTMLElement | null)?.closest?.('[data-zoom]')
      if (!(image instanceof HTMLImageElement)) return
      // A picture inside a link belongs to the link.
      if (image.closest('a')) return
      event.preventDefault()
      reset()
      setShot({ src: image.currentSrc || image.src, alt: image.alt })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [reset])

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (shot && !node.open) node.showModal()
    if (!shot && node.open) node.close()
  }, [shot])

  const zoomBy = useCallback((factor: number) => {
    setScale((current) => {
      const next = Math.min(MAX, Math.max(MIN, current * factor))
      // Back to the middle when it no longer fills the screen, so a picture
      // cannot be left parked off the edge at 1×.
      if (next === MIN) setOffset({ x: 0, y: 0 })
      return next
    })
  }, [])

  return (
    <dialog
      ref={dialog}
      onClose={() => setShot(null)}
      onCancel={() => setShot(null)}
      aria-label={shot?.alt || undefined}
      className="bg-ink/85 fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-transparent"
    >
      {shot && (
        <div
          className="relative grid h-full w-full touch-none place-items-center overflow-hidden"
          // A click on the ground, not on the picture, closes it.
          onClick={(event) => {
            if (event.target === event.currentTarget) setShot(null)
          }}
          onWheel={(event) => {
            // A trackpad pinch is a wheel event with `ctrlKey`; a plain wheel is
            // a scroll, and there is nothing here to scroll.
            event.preventDefault()
            zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12)
          }}
          onPointerDown={(event) => {
            ;(event.target as Element).setPointerCapture?.(event.pointerId)
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
            if (pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()]
              pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale }
            } else if (scale > 1) {
              drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
            }
          }}
          onPointerMove={(event) => {
            if (!pointers.current.has(event.pointerId)) return
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

            if (pinch.current && pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()]
              const distance = Math.hypot(a.x - b.x, a.y - b.y)
              const next = (pinch.current.scale * distance) / pinch.current.distance
              setScale(Math.min(MAX, Math.max(MIN, next)))
              return
            }

            if (drag.current) {
              setOffset({
                x: drag.current.ox + (event.clientX - drag.current.x),
                y: drag.current.oy + (event.clientY - drag.current.y),
              })
            }
          }}
          onPointerUp={(event) => {
            pointers.current.delete(event.pointerId)
            if (pointers.current.size < 2) pinch.current = null
            drag.current = null
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot.src}
            alt={shot.alt}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              cursor: scale > 1 ? 'grab' : 'zoom-in',
            }}
            // A tap toggles, rather than a tap in and a double tap out: a
            // double tap is two taps, so the pair fought each other — in, then
            // straight back out, which measured as never zooming at all.
            onClick={() => (scale > 1 ? reset() : zoomBy(2.5))}
            className="max-h-[92dvh] max-w-[94vw] object-contain transition-transform duration-100 select-none"
          />

          <button
            type="button"
            onClick={() => setShot(null)}
            aria-label="Close"
            className="text-paper hover:bg-paper/15 absolute end-3 top-3 grid size-11 place-items-center rounded-full"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>
      )}
    </dialog>
  )
}
