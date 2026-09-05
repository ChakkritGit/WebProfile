import type { API } from '@editorjs/editorjs'

/**
 * Collapsible sections: one of them is a toggle, several are an accordion.
 *
 * Both were `editorjs-toggle-block` and our own accordion at first. The plugin
 * does not put the hidden content inside the block — it records how many of the
 * blocks after it are its own and leaves them in the document as siblings,
 * tracked by a key written into the DOM. Everything that went wrong with it
 * followed from that: the caret sat 25px above its own title, clicking the empty
 * section did not put the caret in it, a collapsed toggle swallowed the space
 * after it so there was nowhere to type, and the `+` button stopped appearing on
 * the block that followed one.
 *
 * So the content lives in the block, for both shapes. That costs the ability to
 * nest an image or a code block inside a section — the body is rich text, with
 * the inline toolbar over it — and buys a section that behaves like every other
 * block in the editor: it moves, copies and deletes in one piece, the block
 * after it is an ordinary block, and a page can render it without working out
 * where the group ends.
 */

export interface Section {
  title: string
  content: string
}

export interface SectionsData {
  items: Section[]
}

const EMPTY: Section = { title: '', content: '' }

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

/** The shared implementation. `SINGLE` is the whole difference between the two. */
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
  protected readOnly: boolean
  protected wrapper: HTMLElement | null = null

  constructor({ data, api, readOnly }: { data: SectionsData; api: API; readOnly: boolean }) {
    this.api = api
    this.readOnly = readOnly
    const items = Array.isArray(data?.items) && data.items.length ? data.items : [{ ...EMPTY }]
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
    // only opens and closes: the section is never hidden from the author, since
    // a collapsed one in the editor is a piece of the article nobody can find.
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
          row.remove()
        } else {
          this.api.notifier.show({ message: 'ต้องเหลืออย่างน้อยหนึ่งหัวข้อ', style: 'error' })
        }
      })
      head.appendChild(remove)
    }

    const body = el('div', 'sections-tool__body', {
      contentEditable: String(!this.readOnly),
      innerHTML: item.content ?? '',
    })
    body.dataset.placeholder = 'เนื้อหา'

    row.append(head, body)
    return row
  }

  private renderAddButton(): HTMLElement {
    const add = el('button', 'sections-tool__add', { type: 'button', textContent: '+ เพิ่มหัวข้อ' })
    add.addEventListener('click', () => {
      if (!this.wrapper) return
      const row = this.renderItem({ ...EMPTY })
      this.wrapper.insertBefore(row, add)
      row.querySelector<HTMLElement>('.sections-tool__title')?.focus()
    })
    return add
  }

  save(wrapper: HTMLElement): SectionsData {
    const items = [...wrapper.querySelectorAll('.sections-tool__item')].map((row) => ({
      title: row.querySelector('.sections-tool__title')?.innerHTML.trim() ?? '',
      content: row.querySelector('.sections-tool__body')?.innerHTML.trim() ?? '',
    }))
    return { items: items.filter((item) => item.title || item.content) }
  }

  /** A group where every section is blank is an empty block, and is dropped. */
  validate(data: SectionsData) {
    return Boolean(data.items?.length)
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
