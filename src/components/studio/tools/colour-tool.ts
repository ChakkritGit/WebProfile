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
  private dismiss: (() => void) | null = null

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

  /**
   * The palette is mounted on `document.body`, not returned from `renderActions()`.
   *
   * Editor.js owns whatever `renderActions()` returns and pulls it out of the DOM
   * each time the inline toolbar closes — which it does the moment a swatch is
   * clicked. The palette was therefore gone before a second colour could be
   * picked, and re-opening the tool removed it again. Owning the element here
   * keeps it alive across picks; it is positioned against the button by hand.
   */
  private buildPalette(): HTMLElement {
    const palette = document.createElement('div')
    palette.classList.add('studio-colour__palette')
    palette.dataset.studioPalette = this.property
    palette.hidden = true

    // Focus must stay in the editor, or the browser drops the text selection
    // before the click lands and there is nothing left to colour.
    palette.addEventListener('mousedown', (event) => event.preventDefault())

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
        // Left open on purpose: trying colours against the real text is the
        // whole point of a palette, and re-opening it cost two more clicks.
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
      this.close()
    })
    palette.append(clear)

    // A remount would otherwise leave the previous palette orphaned on the body.
    document.querySelector(`[data-studio-palette="${this.property}"]`)?.remove()
    document.body.append(palette)
    return palette
  }

  private open(): void {
    const palette = (this.palette ??= this.buildPalette())
    const anchor = this.button?.getBoundingClientRect()
    if (!anchor) return

    // Drop below the whole toolbar, not below the button: the button sits inside
    // the toolbar's padding, so clearing only the button overlapped its border.
    const bar = this.button?.closest('.ce-popover__container')?.getBoundingClientRect()

    palette.hidden = false
    const width = palette.offsetWidth
    palette.style.top = `${(bar?.bottom ?? anchor.bottom) + 8}px`
    palette.style.left = `${Math.min(Math.max(8, anchor.left - 8), window.innerWidth - width - 8)}px`

    const dismiss = (event: Event) => {
      if (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Escape') return
      if (event.type === 'mousedown' && palette.contains(event.target as Node)) return
      this.close()
    }
    document.addEventListener('mousedown', dismiss, true)
    document.addEventListener('keydown', dismiss, true)
    window.addEventListener('scroll', dismiss, true)
    this.dismiss = () => {
      document.removeEventListener('mousedown', dismiss, true)
      document.removeEventListener('keydown', dismiss, true)
      window.removeEventListener('scroll', dismiss, true)
      this.dismiss = null
    }
  }

  private close(): void {
    if (this.palette) this.palette.hidden = true
    this.dismiss?.()
  }

  /** Editor.js calls this when the toolbar button is pressed. */
  surround(range: Range): void {
    if (!range) return
    // Keep the selection: opening the palette moves focus off the text.
    this.savedRange = range.cloneRange()
    if (this.palette && !this.palette.hidden) this.close()
    else this.open()
  }

  checkState(): boolean {
    const active = this.isInsideColoured()
    this.button?.classList.toggle('ce-inline-tool--active', active)
    return active
  }

  clear(): void {
    // Editor.js tears the inline toolbar down on every selection change —
    // including the one our own edit causes. Honouring that here closed the
    // palette and dropped the range after a single pick, so the second colour
    // had nothing to act on. While the palette is open it closes on its own
    // terms: an outside click, Escape, or a scroll.
    if (this.palette && !this.palette.hidden) return
    this.close()
    this.savedRange = null
  }

  destroy(): void {
    this.dismiss?.()
    this.palette?.remove()
    this.palette = null
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
    const selection = window.getSelection()
    // The live selection is the fallback: each apply re-selects what it wrote,
    // so it stays correct even if the saved range was cleared in between.
    const range =
      this.savedRange ?? (selection?.rangeCount ? selection.getRangeAt(0) : null)
    if (!range || range.collapsed) return

    selection?.removeAllRanges()
    selection?.addRange(range)

    const contents = range.extractContents()

    // Strip the property wherever the selection already carries it. Wrapping a
    // second colour around the first left the old span nested inside the new
    // one, where being deeper won it the cascade — so every colour after the
    // first looked like it did nothing.
    contents.querySelectorAll('span[style]').forEach((span) => {
      const el = span as HTMLElement
      el.style.removeProperty(this.property)
      if (!el.getAttribute('style')) el.replaceWith(...Array.from(el.childNodes))
    })

    let inserted: Node[]
    if (colour === null) {
      inserted = Array.from(contents.childNodes)
      range.insertNode(contents)
    } else {
      const span = document.createElement('span')
      span.style.setProperty(this.property, colour)
      span.append(contents)
      inserted = [span]
      range.insertNode(span)
    }

    // Leave the text selected. Dropping the selection closed the toolbar, so
    // picking a different colour meant re-selecting the text first; and the
    // range is what a follow-up pick re-wraps.
    if (inserted.length === 0) {
      selection?.removeAllRanges()
      this.savedRange = null
      return
    }

    const restored = document.createRange()
    restored.setStartBefore(inserted[0])
    restored.setEndAfter(inserted[inserted.length - 1])
    selection?.removeAllRanges()
    selection?.addRange(restored)
    this.savedRange = restored.cloneRange()
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
