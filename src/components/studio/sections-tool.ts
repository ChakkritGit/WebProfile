import EditorJS from '@editorjs/editorjs'
import type { API, OutputBlockData, ToolSettings } from '@editorjs/editorjs'

/**
 * Collapsible sections: one of them is a toggle, several are an accordion.
 *
 * Both were third-party tools first. `editorjs-toggle-block` does not put the
 * hidden content inside the block — it records how many of the blocks after it
 * are its own and leaves them in the document as siblings, tracked by a key
 * written into the DOM. Everything that went wrong followed from that: a caret
 * 25px above its own title, a first click on the empty section that did not put
 * the caret in it, a collapsed toggle that swallowed the space after itself so
 * there was nowhere left to type, and a `+` that stopped appearing on the block
 * after one.
 *
 * So the content lives in the block. A section holds real blocks rather than a
 * line of rich text, which is what an aside usually needs — a list, a picture,
 * a snippet — and it holds them as block data, not as HTML: the article page
 * renders them with the same per-type renderers as everything else, so nothing
 * had to be added to the small set of inline tags it trusts.
 *
 * Each section body is its own editor. That is the price of nesting without the
 * sibling bookkeeping, and it is a real one: two Editor.js instances share a
 * document, so a keystroke inside a section is a keystroke the outer editor can
 * also see. What that costs is contained here — see `stopBubbling`.
 */

export interface Section {
  title: string
  /** Block data, as `saver.save()` returns it. */
  blocks: OutputBlockData[]
  /** The shape sections had before they could hold blocks. Read, never written. */
  content?: string
}

export interface SectionsData {
  items: Section[]
}

interface SectionsConfig {
  /** The tools a section may contain, handed down by the outer editor. */
  tools?: Record<string, ToolSettings>
  placeholder?: string
}

const CARET = `<svg class="sections-tool__caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>`

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  Object.assign(node, props)
  return node
}

/** An old `content` string becomes the one paragraph it always was. */
function blocksOf(item: Section): OutputBlockData[] {
  if (Array.isArray(item.blocks) && item.blocks.length) return item.blocks
  if (item.content) return [{ type: 'paragraph', data: { text: item.content } }]
  return []
}

/**
 * Keeps a section's keystrokes inside its own editor.
 *
 * Both editors listen on the document, so without this the outer one answers
 * every Enter and Backspace typed inside a section: Enter would split the
 * section's own block in two, and Backspace at the start of a nested paragraph
 * would delete the section. Listening in the capture phase on the section's
 * wrapper stops the event before it reaches the document at all — the nested
 * editor binds to its own elements, so it still gets everything it needs.
 */
function stopBubbling(node: HTMLElement) {
  const swallow = (event: Event) => event.stopPropagation()
  for (const type of ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut'] as const) {
    node.addEventListener(type, swallow)
  }
}

abstract class SectionsTool {
  static get enableLineBreaks() {
    return true
  }

  static get isReadOnlySupported() {
    return true
  }

  /** One section and no way to add another, or many. */
  protected static SINGLE = false

  protected data: SectionsData
  protected api: API
  protected config: SectionsConfig
  protected readOnly: boolean
  protected wrapper: HTMLElement | null = null

  /** One nested editor per section, in the order the sections appear. */
  private editors = new Map<HTMLElement, EditorJS>()

  constructor({
    data,
    api,
    config,
    readOnly,
  }: {
    data: SectionsData
    api: API
    config: SectionsConfig
    readOnly: boolean
  }) {
    this.api = api
    this.config = config ?? {}
    this.readOnly = readOnly
    const items = Array.isArray(data?.items) && data.items.length ? data.items : [{ title: '', blocks: [] }]
    this.data = { items: this.single ? items.slice(0, 1) : items }
  }

  private get single() {
    return (this.constructor as typeof SectionsTool).SINGLE
  }

  render(): HTMLElement {
    const wrapper = el('div', `sections-tool${this.single ? ' sections-tool--single' : ''}`)
    this.wrapper = wrapper
    this.data.items.forEach((item) => wrapper.appendChild(this.renderItem(item)))
    if (!this.readOnly && !this.single) wrapper.appendChild(this.renderAddButton())
    return wrapper
  }

  private renderItem(item: Section): HTMLElement {
    const row = el('div', 'sections-tool__item')

    const head = el('div', 'sections-tool__head')

    // A real button, so it is reachable by keyboard and says what it does. It
    // only folds the section while writing and never decides what the page does
    // with it: a section collapsed in the editor would be a piece of the article
    // its author cannot find.
    const caret = el('button', 'sections-tool__toggle', { type: 'button', innerHTML: CARET })
    caret.setAttribute('aria-label', 'ย่อ/ขยายหัวข้อนี้')
    caret.addEventListener('click', () => row.classList.toggle('sections-tool__item--closed'))

    const title = el('div', 'sections-tool__title', {
      contentEditable: String(!this.readOnly),
      innerHTML: item.title ?? '',
    })
    title.dataset.placeholder = 'หัวข้อ'

    head.append(caret, title)

    if (!this.readOnly && !this.single) {
      const remove = el('button', 'sections-tool__remove', { type: 'button', innerHTML: '&times;' })
      remove.title = 'ลบหัวข้อนี้'
      remove.addEventListener('click', () => {
        // Never down to nothing: a block with no sections cannot be typed back
        // into, and would have to be deleted and made again.
        if (this.wrapper && this.wrapper.querySelectorAll('.sections-tool__item').length > 1) {
          this.editors.get(row)?.destroy()
          this.editors.delete(row)
          row.remove()
        } else {
          this.api.notifier.show({ message: 'ต้องเหลืออย่างน้อยหนึ่งหัวข้อ', style: 'error' })
        }
      })
      head.appendChild(remove)
    }

    const body = el('div', 'sections-tool__body')
    stopBubbling(body)
    row.append(head, body)

    // Editor.js wants a holder that is in the document, and `render` returns
    // before the block is attached — so the nested editor is built on the next
    // frame rather than here.
    requestAnimationFrame(() => this.mount(row, body, blocksOf(item)))
    return row
  }

  private mount(row: HTMLElement, body: HTMLElement, blocks: OutputBlockData[]) {
    if (!body.isConnected) return

    const nested = new EditorJS({
      holder: body,
      readOnly: this.readOnly,
      minHeight: 0,
      placeholder: this.config.placeholder ?? 'เนื้อหาในหัวข้อนี้',
      data: blocks.length ? { blocks } : undefined,
      tools: this.config.tools ?? {},
    })
    this.editors.set(row, nested)
  }

  private renderAddButton(): HTMLElement {
    const add = el('button', 'sections-tool__add', { type: 'button', textContent: '+ เพิ่มหัวข้อ' })
    add.addEventListener('click', () => {
      if (!this.wrapper) return
      const row = this.renderItem({ title: '', blocks: [] })
      this.wrapper.insertBefore(row, add)
      row.querySelector<HTMLElement>('.sections-tool__title')?.focus()
    })
    return add
  }

  /**
   * Asynchronous, because each section has an editor of its own to ask. Editor.js
   * awaits a tool's `save`, so this is simply allowed to take its time.
   */
  async save(wrapper: HTMLElement): Promise<SectionsData> {
    const rows = [...wrapper.querySelectorAll<HTMLElement>('.sections-tool__item')]

    const items = await Promise.all(
      rows.map(async (row) => {
        const title = row.querySelector('.sections-tool__title')?.innerHTML.trim() ?? ''
        const nested = this.editors.get(row)
        let blocks: OutputBlockData[] = []
        try {
          blocks = nested ? ((await nested.save()).blocks ?? []) : []
        } catch {
          // A nested block mid-edit can refuse to serialise; the next save gets
          // it, and losing the section's title as well would be worse.
        }
        return { title, blocks }
      }),
    )

    return { items: items.filter((item) => item.title || item.blocks.length) }
  }

  /** A group where every section is blank is an empty block, and is dropped. */
  validate(data: SectionsData) {
    return Boolean(data.items?.length)
  }

  /** Editor.js calls this when the block goes; the nested editors go with it. */
  destroy() {
    for (const nested of this.editors.values()) nested.destroy()
    this.editors.clear()
  }
}

const ACCORDION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3.5" width="18" height="6" rx="2"/><rect x="3" y="13" width="18" height="7.5" rx="2"/><path d="M16.6 6.2 18 7.6l1.4-1.4"/></svg>`

const TOGGLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 4 4-4 4"/><path d="M12 6h8M12 12h8M12 18h8"/></svg>`

/** Several titled sections; opening one closes the last, on the page. */
export class AccordionTool extends SectionsTool {
  static get toolbox() {
    return { title: 'Accordion', icon: ACCORDION_ICON }
  }
}

/** One titled section, for folding an aside away mid-article. */
export class ToggleTool extends SectionsTool {
  protected static SINGLE = true

  static get toolbox() {
    return { title: 'Toggle', icon: TOGGLE_ICON }
  }
}
