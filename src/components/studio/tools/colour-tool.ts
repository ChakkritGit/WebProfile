/**
 * Inline colour tools — text colour and highlight.
 *
 * Written in-house because `editorjs-text-color-plugin` renders nothing under
 * Editor.js 2.31: it targets an older inline-tool API, so both buttons appeared
 * but neither opened a palette.
 *
 * Emits `<span style="color:…">` / `<span style="background-color:…">`, which is
 * exactly the subset `rich-text.tsx` validates and re-renders on the public
 * side (literal colour values only — never arbitrary CSS).
 */

interface ToolConfig {
  colors?: string[]
  /** Which CSS property the swatch sets. */
  property?: 'color' | 'background-color'
  title?: string
  icon?: string
}

const TEXT_SWATCHES = ['#FF5A5F', '#23C4B4', '#E8A317', '#7C5CFF', '#3FA0FF', '#241F2E']
const MARK_SWATCHES = ['#FFE4E2', '#D3F5F1', '#FFF1CC', '#E8E2FF', '#DDEEFF', '#E7E4EE']

const TEXT_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
  'stroke-linecap="round"><path d="M5 18h14M8.5 14 12 5l3.5 9M9.6 11.5h4.8"/></svg>'
const MARK_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M6.5 16.5l7.5-7.5 3.5 3.5-7.5 7.5H6.5z"/></svg>'

class ColourTool {
  static get isInline() {
    return true
  }

  static get sanitize() {
    // Editor.js strips unknown attributes; the renderer still validates the
    // value itself, so a hostile style can never reach the page.
    return { span: { style: true } }
  }

  protected property: 'color' | 'background-color' = 'color'
  protected swatches: string[] = TEXT_SWATCHES
  protected icon: string = TEXT_ICON
  protected label = 'Colour'

  private button: HTMLButtonElement | null = null
  private palette: HTMLElement | null = null
  private savedRange: Range | null = null

  constructor({ config }: { config?: ToolConfig } = {}) {
    if (config?.property) this.property = config.property
    if (config?.colors?.length) this.swatches = config.colors
    if (config?.icon) this.icon = config.icon
    if (config?.title) this.label = config.title
  }

  render(): HTMLElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.classList.add('ce-inline-tool', 'studio-colour__btn')
    button.innerHTML = this.icon
    button.title = this.label
    button.setAttribute('aria-label', this.label)
    this.button = button
    return button
  }

  renderActions(): HTMLElement {
    const palette = document.createElement('div')
    palette.classList.add('studio-colour__palette')
    palette.hidden = true

    for (const colour of this.swatches) {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.classList.add('studio-colour__swatch')
      swatch.style.background = colour
      swatch.title = colour
      swatch.setAttribute('aria-label', `${this.label} ${colour}`)
      swatch.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.apply(colour)
        palette.hidden = true
      })
      palette.append(swatch)
    }

    const clear = document.createElement('button')
    clear.type = 'button'
    clear.classList.add('studio-colour__clear')
    clear.textContent = '✕'
    clear.title = 'Remove'
    clear.setAttribute('aria-label', 'Remove colour')
    clear.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.apply(null)
      palette.hidden = true
    })
    palette.append(clear)

    this.palette = palette
    return palette
  }

  /** Editor.js calls this when the toolbar button is pressed. */
  surround(range: Range): void {
    if (!range) return
    // Keep the selection: opening the palette moves focus off the text.
    this.savedRange = range.cloneRange()
    if (this.palette) this.palette.hidden = !this.palette.hidden
  }

  checkState(): boolean {
    const active = this.isInsideColoured()
    this.button?.classList.toggle('ce-inline-tool--active', active)
    return active
  }

  clear(): void {
    if (this.palette) this.palette.hidden = true
    this.savedRange = null
  }

  private isInsideColoured(): boolean {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement | null)
    const span = element?.closest?.('span[style]') as HTMLElement | null | undefined
    if (!span) return false
    return Boolean(span.style.getPropertyValue(this.property))
  }

  private apply(colour: string | null) {
    const range = this.savedRange
    if (!range) return

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    if (colour === null) {
      // Unwrap: replace any coloured span in the selection with its contents.
      const contents = range.extractContents()
      contents.querySelectorAll('span[style]').forEach((span) => {
        const el = span as HTMLElement
        el.style.removeProperty(this.property)
        if (!el.getAttribute('style')) el.replaceWith(...Array.from(el.childNodes))
      })
      range.insertNode(contents)
    } else {
      const span = document.createElement('span')
      span.style.setProperty(this.property, colour)
      span.append(range.extractContents())
      range.insertNode(span)
    }

    selection?.removeAllRanges()
    this.savedRange = null
  }
}

export class TextColourTool extends ColourTool {
  static get title() {
    return 'Text colour'
  }
  constructor(args: { config?: ToolConfig } = {}) {
    super({ config: { property: 'color', colors: TEXT_SWATCHES, icon: TEXT_ICON, title: 'Text colour', ...args.config } })
  }
}

export class HighlightTool extends ColourTool {
  static get title() {
    return 'Highlight'
  }
  constructor(args: { config?: ToolConfig } = {}) {
    super({
      config: {
        property: 'background-color',
        colors: MARK_SWATCHES,
        icon: MARK_ICON,
        title: 'Highlight',
        ...args.config,
      },
    })
  }
}
