'use client'

import { useEffect, useRef } from 'react'
import EditorJS, { type OutputData } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import Paragraph from '@editorjs/paragraph'
import List from '@editorjs/list'
import Checklist from '@editorjs/checklist'
import Quote from '@editorjs/quote'
import CodeFlask from '@calumk/editorjs-codeflask'
import CodeTool from '@editorjs/code'
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
import ColorPlugin from 'editorjs-text-color-plugin'
import AlignmentTune from 'editorjs-text-alignment-blocktune'

import type { EditorDocument } from '@/lib/editor'
import './editor-theme.css'

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
          header: { class: Header as never, inlineToolbar: true, config: { levels: [2, 3, 4], defaultLevel: 2 } },
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
          code: {
          class: CodeFlask as never,
          config: { defaultLanguage: 'plain' },
        },
        // Blocks saved by the previous plain-code tool still carry type "code",
        // which CodeFlask reads, so nothing legacy is stranded.
        rawCode: { class: CodeTool as never, toolbox: false },
          delimiter: Delimiter as never,
          table: { class: Table as never, inlineToolbar: true },
          image: {
            class: ImageTool as never,
            config: {
              endpoints: { byFile: '/api/upload', byUrl: '/api/upload' },
              field: 'image',
              types: 'image/*',
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
        color: {
          class: ColorPlugin as never,
          config: {
            colorCollections: ['#FF5A5F', '#23C4B4', '#FFC93C', '#7C5CFF', '#3FA0FF', '#241F2E'],
            defaultColor: '#FF5A5F',
            type: 'text',
            customPicker: true,
          },
        },
        highlight: {
          class: ColorPlugin as never,
          config: {
            colorCollections: ['#FFE4E2', '#D3F5F1', '#FFF1CC', '#E8E2FF', '#DDEEFF'],
            defaultColor: '#FFF1CC',
            type: 'marker',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 16l8-8 4 4-8 8H6z"/></svg>',
          },
        },
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
