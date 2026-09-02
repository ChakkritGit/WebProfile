import { CODE_LANGUAGES } from '@/lib/code-languages'

interface CodeData {
  code: string
  language: string
}

/**
 * Code block with a language picker.
 *
 * Written in-house rather than pulled from a package: the third-party options
 * either had no visible language control, shipped their own stacking context
 * that fought the editor's toolbars, or stored a shape the renderer would have
 * to translate. This emits exactly `{ code, language }` — what Shiki needs on
 * the server — and styles through the same tokens as the rest of the studio.
 */
export class CodeTool {
  static get toolbox() {
    return {
      title: 'Code',
      // Thin stroke, matching the other toolbox marks.
      icon:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5"/></svg>',
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  static get enableLineBreaks() {
    return true
  }

  static get pasteConfig() {
    return { tags: ['pre'] }
  }

  private data: CodeData
  private readOnly: boolean
  private wrapper: HTMLElement | null = null
  private textarea: HTMLTextAreaElement | null = null

  constructor({ data, readOnly }: { data: Partial<CodeData>; readOnly?: boolean }) {
    this.data = {
      code: typeof data?.code === 'string' ? data.code : '',
      language: typeof data?.language === 'string' && data.language ? data.language : 'text',
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.classList.add('studio-code')

    // ---- language picker -------------------------------------------------
    const bar = document.createElement('div')
    bar.classList.add('studio-code__bar')

    const select = document.createElement('select')
    select.classList.add('studio-code__lang')
    select.setAttribute('aria-label', 'Code language')
    select.disabled = this.readOnly

    for (const lang of CODE_LANGUAGES) {
      const option = document.createElement('option')
      option.value = lang.value
      option.textContent = lang.label
      if (lang.value === this.data.language) option.selected = true
      select.append(option)
    }
    select.addEventListener('change', () => {
      this.data.language = select.value
    })
    // Editor.js listens for keydown to move blocks; the select needs its own.
    select.addEventListener('keydown', (event) => event.stopPropagation())

    bar.append(select)

    // ---- code area -------------------------------------------------------
    const textarea = document.createElement('textarea')
    textarea.classList.add('studio-code__area')
    textarea.value = this.data.code
    textarea.placeholder = 'Paste or write code…'
    textarea.spellcheck = false
    textarea.readOnly = this.readOnly
    textarea.rows = Math.max(3, this.data.code.split('\n').length)

    const autosize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    textarea.addEventListener('input', () => {
      this.data.code = textarea.value
      autosize()
    })
    textarea.addEventListener('keydown', (event) => {
      // Enter must insert a newline here, not split the block.
      event.stopPropagation()
      if (event.key === 'Tab') {
        event.preventDefault()
        const { selectionStart: start, selectionEnd: end } = textarea
        textarea.value = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`
        textarea.selectionStart = textarea.selectionEnd = start + 2
        this.data.code = textarea.value
        autosize()
      }
    })

    wrapper.append(bar, textarea)
    this.wrapper = wrapper
    this.textarea = textarea

    // scrollHeight is only meaningful once the element is laid out.
    requestAnimationFrame(autosize)
    return wrapper
  }

  save(): CodeData {
    return {
      code: this.textarea?.value ?? this.data.code,
      language: this.data.language,
    }
  }

  validate(data: CodeData): boolean {
    return typeof data.code === 'string'
  }

  /** Lets `onChange` see edits made inside the textarea. */
  static get contentless() {
    return false
  }
}
