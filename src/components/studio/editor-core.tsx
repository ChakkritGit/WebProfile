'use client'

import { useEffect, useRef } from 'react'
import EditorJS, { type OutputData } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import Paragraph from '@editorjs/paragraph'
import List from '@editorjs/list'
import Checklist from '@editorjs/checklist'
import Quote from '@editorjs/quote'
import InlineCode from '@editorjs/inline-code'
import Marker from '@editorjs/marker'
import Underline from '@editorjs/underline'
import Delimiter from '@editorjs/delimiter'
import Table from '@editorjs/table'
import ImageTool from '@editorjs/image'
import LinkTool from '@editorjs/link'
import Embed from '@editorjs/embed'
import Warning from '@editorjs/warning'
import Alert from 'editorjs-alert'
import AlignmentTune from 'editorjs-text-alignment-blocktune'

import { compressImage } from '@/lib/compress-image'
import { CodeTool } from './tools/code-tool'
import { HighlightTool, TextColourTool } from './tools/colour-tool'
import type { EditorDocument } from '@/lib/editor'
import './editor-theme.css'

/** What `/api/upload` answers with, in the shape Editor.js expects. */
type UploadResponse = { success: number; file: { url: string } }

interface EditorCoreProps {
  initialData: EditorDocument
  onChange: (data: EditorDocument) => void
  placeholder?: string
}

/**
 * Editor.js instance wrapper.
 *
 * Three lifecycle hazards are handled here:
 *  1. React StrictMode mounts effects twice in development. Creation and
 *     teardown are serialised through `teardownRef`: a new instance waits for
 *     the previous one to finish destroying. Without this the first instance's
 *     async `destroy()` lands *after* the second has rendered and empties the
 *     holder — a blank editor with no error anywhere.
 *  2. `destroy()` must never run mid-initialisation, so it is chained onto the
 *     creation promise rather than fired independently.
 *  3. `onChange` is kept in a ref so changing the callback identity never
 *     re-creates the editor (which would wipe the author's cursor position).
 */
export default function EditorCore({ initialData, onChange, placeholder }: EditorCoreProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorJS | null>(null)
  const onChangeRef = useRef(onChange)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const teardownRef = useRef<Promise<void>>(Promise.resolve())

  // Refs must not be written during render.
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return

    let cancelled = false
    let instance: EditorJS | null = null

    const ready = (async () => {
      // Serialise against any in-flight teardown (see note 1 above).
      await teardownRef.current
      if (cancelled) return

      instance = new EditorJS({
        holder,
        placeholder,
        autofocus: false,
        data: initialData.blocks.length ? (initialData as OutputData) : undefined,
        tunes: ['alignment'],
        tools: {
          alignment: {
            class: AlignmentTune as never,
            config: {
              default: 'left',
              blocks: { header: 'left', paragraph: 'left', quote: 'left' },
            },
          },
          header: {
            class: Header as never,
            inlineToolbar: true,
            config: { levels: [2, 3, 4], defaultLevel: 2 },
          },
          paragraph: { class: Paragraph as never, inlineToolbar: true },
          list: { class: List as never, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
          checklist: {
            class: Checklist as never,
            inlineToolbar: true,
            // `list` already offers a Checklist; this stays registered only so
            // existing `type: "checklist"` blocks keep loading.
            toolbox: false,
          },
          quote: { class: Quote as never, inlineToolbar: true },
          code: { class: CodeTool as never },
          delimiter: Delimiter as never,
          table: { class: Table as never, inlineToolbar: true },
          image: {
            class: ImageTool as never,
            config: {
              field: 'image',
              types: 'image/*',
              // An uploader rather than `endpoints`, so a picture can be shrunk
              // in the browser on its way out. A phone camera file is several
              // megabytes of detail nobody will see at article width, and every
              // byte of it would otherwise sit in storage and go down the wire
              // to every reader.
              uploader: {
                async uploadByFile(file: File) {
                  const body = new FormData()
                  body.append('image', await compressImage(file))
                  const response = await fetch('/api/upload', { method: 'POST', body })
                  return (await response.json()) as UploadResponse
                },
                async uploadByUrl(url: string) {
                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ url }),
                  })
                  return (await response.json()) as UploadResponse
                },
              },
            },
          },
          linkTool: {
            class: LinkTool as never,
            // Without an endpoint the tool can only report "Couldn't get this
            // link data" — it has no way to resolve a title or preview itself.
            config: { endpoint: '/api/link-preview' },
          },
          warning: {
            class: Warning as never,
            inlineToolbar: true,
            config: { titlePlaceholder: 'Title', messagePlaceholder: 'Message' },
          },
          alert: {
            class: Alert as never,
            inlineToolbar: true,
            config: { defaultType: 'primary', messagePlaceholder: 'Alert message' },
          },
          embed: { class: Embed as never, inlineToolbar: true },
          inlineCode: InlineCode as never,
          marker: Marker as never,
          underline: Underline as never,
          color: { class: TextColourTool as never },
          highlight: { class: HighlightTool as never },
        },
        async onChange(api) {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(async () => {
            try {
              const saved = await api.saver.save()
              onChangeRef.current(saved as EditorDocument)
            } catch {
              // A block can fail to serialise while it is mid-edit; the next
              // change event will pick it up.
            }
          }, 600)
        },
      })

      editorRef.current = instance
      try {
        await instance.isReady
      } catch {
        // Destroyed while still initialising — nothing more to do.
      }
    })()

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
      editorRef.current = null
      teardownRef.current = ready
        .then(() => {
          instance?.destroy()
        })
        .catch(() => {
          /* never initialised — nothing to tear down */
        })
    }
    // Intentionally mount-only: re-running would discard the author's work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={holderRef} className="studio-editor" />
}
