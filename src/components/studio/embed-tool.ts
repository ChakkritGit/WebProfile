import Embed from '@editorjs/embed'
import type { API, BlockToolData } from '@editorjs/editorjs'

/**
 * A way into the embed tool.
 *
 * `@editorjs/embed` declares no `toolbox`, so it never appears in the `+` menu:
 * the only way to reach it is to paste a bare link into an empty block and know
 * that doing so will work. Everything else in the menu can be found by looking,
 * and this could not be found at all.
 *
 * So this is the entry, and nothing more. It asks for a URL, resolves it against
 * the tool's own service table, and replaces itself with a real `embed` block —
 * which then renders, saves and re-opens exactly as a pasted one does. Nothing
 * here re-implements what the tool already knows, and nothing of it survives in
 * a saved document.
 */

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.6" y="4.6" width="18.8" height="14.8" rx="3.4"/><path d="M10.4 9.5v5l4.2-2.5-4.2-2.5Z" fill="currentColor" stroke="none"/></svg>`

type EmbedBlockData = {
  service: string
  source: string
  embed: string
  width?: number
  height?: number
}

/**
 * The first service whose pattern claims this URL.
 *
 * `Embed.services` is the table the tool builds in `prepare`, which Editor.js
 * runs for every registered tool before any block exists — so by the time
 * anyone can click the toolbox entry, it is populated, defaults and any
 * configured additions alike.
 */
function resolve(url: string): EmbedBlockData | null {
  for (const [service, config] of Object.entries(Embed.services ?? {})) {
    if (!config?.regex || !config.embedUrl) continue
    const match = url.match(config.regex)
    if (!match) continue

    const groups = match.slice(1)
    // Most services take the first capture as the id; the ones with query
    // strings to sort out (YouTube's `t=`, for one) provide their own function.
    const id = config.id ? config.id(groups) : groups[0]
    if (!id) continue

    return {
      service,
      source: url,
      embed: config.embedUrl.replace('<%= remote_id %>', id),
      width: config.width,
      height: config.height,
    }
  }
  return null
}

export class EmbedPrompt {
  static get toolbox() {
    return { title: 'Embed', icon: ICON }
  }

  /** There is nothing to show a reader: the block is gone before a save. */
  static get isReadOnlySupported() {
    return false
  }

  private api: API

  constructor({ api }: { api: API }) {
    this.api = api
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'embed-prompt'

    const input = document.createElement('input')
    input.type = 'url'
    input.className = 'embed-prompt__input'
    input.placeholder = 'วางลิงก์ YouTube, Vimeo, CodePen, Figma…'

    const commit = () => {
      const url = input.value.trim()
      if (!url) return

      const data = resolve(url)
      if (!data) {
        this.api.notifier.show({
          message: 'That link is not one of the services this can embed.',
          style: 'error',
        })
        return
      }

      // `replace`, so the prompt does not linger above the thing it made.
      this.api.blocks.insert(
        'embed',
        data as BlockToolData,
        undefined,
        this.api.blocks.getCurrentBlockIndex(),
        true,
        true,
      )
    }

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      commit()
    })

    // Editor.js watches for pastes anywhere in a block and would try to turn
    // this one into a block of its own, leaving the prompt behind. The paste is
    // ours; the value lands after the event, hence the tick.
    input.addEventListener('paste', (event) => {
      event.stopPropagation()
      setTimeout(commit, 0)
    })

    wrapper.appendChild(input)
    // The toolbox closes before the block is in the document, so focus has to
    // wait for it to be there.
    setTimeout(() => input.focus(), 0)
    return wrapper
  }

  /**
   * Never saved. A prompt nobody filled in would otherwise persist as a block
   * type the article renderer has never heard of; returning `false` from
   * `validate` is what tells Editor.js to drop it.
   */
  save() {
    return {}
  }

  validate() {
    return false
  }
}
