import type EditorJS from '@editorjs/editorjs'
import type { OutputData } from '@editorjs/editorjs'

/**
 * Undo and redo, which Editor.js does not have.
 *
 * The browser's own history covers typing inside one block and nothing else:
 * delete a block, move one, or turn a paragraph into a heading, and there is
 * nothing to go back to — pressing undo after any of those eats a character
 * somewhere instead.
 *
 * `editorjs-undo` is the usual answer and it corrupted the document on the first
 * case tried: clearing a block's text and pressing undo left four blocks where
 * there had been three, the restored one inserted beside the empty one rather
 * than in place of it, and redo then duplicated a third. So this, which is small
 * enough to be sure about: a stack of whole-document snapshots, and a full
 * re-render to move between them.
 *
 * The snapshots cost nothing extra. The editor already serialises the document
 * on every change to hand it to the form, so `record` is given that same object.
 */

const LIMIT = 80

function sameAs(a: OutputData | undefined, b: OutputData) {
  return a !== undefined && JSON.stringify(a.blocks) === JSON.stringify(b.blocks)
}

export class History {
  private stack: OutputData[]
  private index: number
  private editor: EditorJS

  constructor(editor: EditorJS, initial: OutputData) {
    this.editor = editor
    this.stack = [initial]
    this.index = 0
  }

  /**
   * Adds a state, unless it is the one already on top.
   *
   * That guard is also what stops an undo from being recorded as a change of its
   * own: re-rendering fires the editor's change handler, which arrives back here
   * with exactly the state just applied. Comparing the documents rather than
   * racing a flag against a debounce means the timing cannot be got wrong.
   */
  record(state: OutputData) {
    if (sameAs(this.stack[this.index], state)) return

    // Anything ahead of here was a future that this change has replaced.
    this.stack.length = this.index + 1
    this.stack.push(state)
    if (this.stack.length > LIMIT) this.stack.shift()
    this.index = this.stack.length - 1
  }

  canUndo() {
    return this.index > 0
  }

  canRedo() {
    return this.index < this.stack.length - 1
  }

  async undo() {
    if (!this.canUndo()) return
    this.index -= 1
    await this.apply()
  }

  async redo() {
    if (!this.canRedo()) return
    this.index += 1
    await this.apply()
  }

  private async apply() {
    const state = this.stack[this.index]
    try {
      await this.editor.blocks.render({ blocks: state.blocks })
      // Somewhere to type after the document is replaced; without this the caret
      // is nowhere and the next keystroke goes to the page.
      this.editor.caret.setToLastBlock('end')
    } catch {
      // Destroyed mid-flight, or a block that will not re-render. The stack is
      // still consistent; the next attempt starts from where this one meant to
      // arrive.
    }
  }
}

/**
 * Binds the keys, and hands back the unbinding.
 *
 * On the holder rather than the document: two editors on one page would
 * otherwise both answer, and a keystroke meant for a form field elsewhere would
 * rewrite the article.
 */
export function bindHistoryKeys(holder: HTMLElement, history: History) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey)) return

    const key = event.key.toLowerCase()
    const isUndo = key === 'z' && !event.shiftKey
    const isRedo = (key === 'z' && event.shiftKey) || key === 'y'
    if (!isUndo && !isRedo) return

    // The browser's own history would otherwise run as well, and undo twice.
    event.preventDefault()
    event.stopPropagation()
    void (isUndo ? history.undo() : history.redo())
  }

  holder.addEventListener('keydown', onKeyDown, true)
  return () => holder.removeEventListener('keydown', onKeyDown, true)
}
