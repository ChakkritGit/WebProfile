'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useScrollLock } from '@/lib/hooks'
import { MORPH } from '@/components/ui/morphing-dialog'
import { CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

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

/** Where the picture starts from, so it grows out of the one on the page. */
type From = { x: number; y: number; scale: number }

type Shot = { src: string; alt: string; from: From }

/**
 * The thumbnail's box, expressed as an offset from where the opened picture will
 * land.
 *
 * Measured rather than animated blind: the opened picture is centred and sized
 * `object-contain` inside 94vw x 92dvh, which is `min(1, …)` of its natural size,
 * so the box it will occupy is known before it is rendered and no first frame has
 * to be painted to find out. A picture that has not loaded (no natural size) is
 * taken at the size it is on the page.
 */
function fromRect(image: HTMLImageElement): From {
  const rect = image.getBoundingClientRect()
  const naturalW = image.naturalWidth || rect.width
  const naturalH = image.naturalHeight || rect.height
  const fit = Math.min(1, (window.innerWidth * 0.94) / naturalW, (window.innerHeight * 0.92) / naturalH)
  const landedW = naturalW * fit || rect.width

  return {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2,
    scale: rect.width / landedW,
  }
}

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
  /** How far this gesture moved, so a drag does not end in a tap. */
  const travel = useRef(0)
  const [moving, setMoving] = useState(false)
  /**
   * The picture is on its way out, but still here.
   *
   * A native `<dialog>` is gone the moment it is closed, so the shrink back into
   * the page has nowhere to play. The dialog stays open through the exit and is
   * closed by `onExitComplete`.
   */
  const [closing, setClosing] = useState(false)
  const reduce = useReducedMotion()

  // `showModal()` puts the dialog in the top layer but leaves the document
  // behind it scrollable.
  useScrollLock(shot !== null)

  const dismiss = useCallback(() => setClosing(true), [])

  /**
   * The picture on the page, hidden while it is the one on the screen.
   *
   * The opened picture is that picture — it grows out of its box and lands back
   * in it — so leaving the original showing underneath meant two of them, and the
   * one on the page sat there through the whole preview. It is hidden rather than
   * removed so the article does not reflow, and given back the moment the exit
   * lands on it. The scroll lock is what makes that box still be there.
   */
  const source = useRef<HTMLImageElement | null>(null)

  const release = useCallback(() => {
    if (source.current) source.current.style.visibility = ''
    source.current = null
  }, [])

  // A picture left hidden by a navigation away from the article would stay that
  // way for as long as the client router keeps the page.
  useEffect(() => release, [release])

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
      setClosing(false)
      setShot({ src: image.currentSrc || image.src, alt: image.alt, from: fromRect(image) })
      release()
      source.current = image
      image.style.visibility = 'hidden'
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [release, reset])

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
      // Escape is the browser closing the dialog outright, which would cut the
      // exit. Refused here and answered the same way the close button is.
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      aria-label={shot?.alt || undefined}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      {shot && (
        <div
          className="relative grid h-full w-full touch-none place-items-center overflow-hidden"
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
            travel.current = 0
            setMoving(true)
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
              const dx = event.clientX - drag.current.x
              const dy = event.clientY - drag.current.y
              travel.current = Math.hypot(dx, dy)
              setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy })
            }
          }}
          onPointerUp={(event) => {
            pointers.current.delete(event.pointerId)
            if (pointers.current.size < 2) pinch.current = null
            drag.current = null
            setMoving(false)
          }}
          // A touch that the browser takes over — a scroll gesture it decides is
          // its own — fires this and not pointerup, and the drag stayed armed.
          onPointerCancel={(event) => {
            pointers.current.delete(event.pointerId)
            pinch.current = null
            drag.current = null
            setMoving(false)
          }}
        >
          <AnimatePresence
            onExitComplete={() => {
              setShot(null)
              setClosing(false)
              release()
            }}
          >
            {!closing && (
              <motion.div
                key="ground"
                aria-hidden
                // The ground closes it, which is where the click that misses the
                // picture lands now that the ground is a layer of its own.
                onClick={dismiss}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.22 }}
                // A fixed near-black, not `--ink`: that token is the *text* colour
                // and flips with the theme, so in dark mode the ground behind a
                // photograph came out white at 85%.
                className="absolute inset-0 bg-[#241f2e]/85"
              />
            )}
            {!closing && (
              <motion.div
                key="shot"
                // Out of the picture on the page and back into it, the way the
                // résumé panel grows out of its button. `from` is that picture's
                // box as an offset from where this one lands.
                initial={shot.from}
                animate={{ x: 0, y: 0, scale: 1 }}
                exit={shot.from}
                transition={reduce ? { duration: 0 } : MORPH}
                className="relative"
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
            // A tap toggles between fit and 2.5×; a drag is not a tap. Dragging a
            // zoomed picture ended in a click, and the click read `scale > 1` and
            // put it back where it started — which is why panning kept snapping
            // to the beginning.
            onClick={() => {
              if (travel.current > 6) return
              if (scale > 1) reset()
              else zoomBy(2.5)
            }}
            // No transition while a finger is down. Animating every frame of a
            // drag over 100ms means each new position starts from a stale one,
            // which is the judder.
            className={cn(
              'max-h-[92dvh] max-w-[94vw] object-contain select-none',
              !moving && 'transition-transform duration-100',
            )}
          />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            // White, fixed, for the same reason the ground behind it is a fixed
            // near-black: `--paper` flips with the theme, so the icon measured
            // rgb(20,18,28) in dark mode — near-black on near-black, invisible.
            className="absolute end-3 top-3 grid size-11 place-items-center rounded-full text-[#fffcf7] hover:bg-[#fffcf7]/15"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>
      )}
    </dialog>
  )
}
