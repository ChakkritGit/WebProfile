import type { API } from '@editorjs/editorjs'

/**
 * An accordion: several titled sections, one open at a time.
 *
 * Not the same thing as the toggle tool sitting next to it in the menu. A toggle
 * is one collapsible section that owns the blocks after it, which is what you
 * want for hiding a long aside in the middle of an article. This is a set that
 * belongs together — a list of questions, a spec sheet, a changelog — where
 * opening one should close the last, and where the whole group is a single block
 * that can be moved, copied and deleted in one piece.
 *
 * Its contents are its own rather than the blocks that follow it, which is what
 * makes it safe to render: an article page can draw the group from the block's
 * own data without having to work out where the group ends.
 */

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3.5" width="18" height="6" rx="2"/><rect x="3" y="13" width="18" height="7.5" rx="2"/><path d="M16.6 6.2 18 7.6l1.4-1.4"/></svg>`

export interface AccordionItem {
  title: string
  content: string
}

export interface AccordionData {
  items: AccordionItem[]
}

const EMPTY: AccordionItem = { title: '', content: '' }

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

export class AccordionTool {
  static get toolbox() {
    return { title: 'Accordion', icon: ICON }
  }

  /** Enter inside a section should break the line, not end the block. */
  static get enableLineBreaks() {
    return true
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: AccordionData
  private api: API
  private readOnly: boolean
  private wrapper: HTMLElement | null = null

  constructor({
    data,
    api,
    readOnly,
  }: {
    data: AccordionData
    api: API
    readOnly: boolean
  }) {
    this.api = api
    this.readOnly = readOnly
    this.data = {
      items: Array.isArray(data?.items) && data.items.length ? data.items : [{ ...EMPTY }],
    }
  }

  render(): HTMLElement {
    const wrapper = el('div', 'accordion-tool')
    this.wrapper = wrapper
    this.data.items.forEach((item) => wrapper.appendChild(this.renderItem(item)))
    if (!this.readOnly) wrapper.appendChild(this.renderAddButton())
    return wrapper
  }

  private renderItem(item: AccordionItem): HTMLElement {
    const row = el('div', 'accordion-tool__item')

    const head = el('div', 'accordion-tool__head')
    const title = el('div', 'accordion-tool__title', {
      contentEditable: String(!this.readOnly),
      innerHTML: item.title ?? '',
    })
    title.dataset.placeholder = 'หัวข้อ'
    head.appendChild(title)

    if (!this.readOnly) {
      const remove = el('button', 'accordion-tool__remove', { type: 'button', innerHTML: '&times;' })
      remove.title = 'ลบหัวข้อนี้'
      remove.addEventListener('click', () => {
        // Never down to nothing: a block with no sections cannot be typed back
        // into, and would have to be deleted and made again.
        if (this.wrapper && this.wrapper.querySelectorAll('.accordion-tool__item').length > 1) {
          row.remove()
        } else {
          this.api.notifier.show({ message: 'ต้องเหลืออย่างน้อยหนึ่งหัวข้อ', style: 'error' })
        }
      })
      head.appendChild(remove)
    }

    const body = el('div', 'accordion-tool__body', {
      contentEditable: String(!this.readOnly),
      innerHTML: item.content ?? '',
    })
    body.dataset.placeholder = 'เนื้อหา'

    row.append(head, body)
    return row
  }

  private renderAddButton(): HTMLElement {
    const add = el('button', 'accordion-tool__add', { type: 'button', textContent: '+ เพิ่มหัวข้อ' })
    add.addEventListener('click', () => {
      if (!this.wrapper) return
      const row = this.renderItem({ ...EMPTY })
      this.wrapper.insertBefore(row, add)
      row.querySelector<HTMLElement>('.accordion-tool__title')?.focus()
    })
    return add
  }

  save(wrapper: HTMLElement): AccordionData {
    const items = [...wrapper.querySelectorAll('.accordion-tool__item')].map((row) => ({
      title: row.querySelector('.accordion-tool__title')?.innerHTML.trim() ?? '',
      content: row.querySelector('.accordion-tool__body')?.innerHTML.trim() ?? '',
    }))
    return { items: items.filter((item) => item.title || item.content) }
  }

  /** A group where every section is blank is an empty block, and is dropped. */
  validate(data: AccordionData) {
    return Boolean(data.items?.length)
  }
}
