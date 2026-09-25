const TAG = 'CARDS:'

/**
 * Streams the model's text through, holding back two things the reader must
 * never see: a <think>…</think> block, and the final `CARDS: …` line, whose ids
 * become cards. Either may arrive split across chunks, so an unfinished line
 * that could still turn into `CARDS:` is held until it can't.
 */
export function createReplyFilter() {
  let buf = ''
  let inThink = false

  const stripThink = () => {
    let out = ''
    for (;;) {
      if (inThink) {
        const close = buf.indexOf('</think>')
        // Keep a tail that may be the start of "</think>" split across chunks.
        if (close < 0) {
          buf = buf.slice(-7)
          return out
        }
        buf = buf.slice(close + 8)
        inThink = false
      }
      const open = buf.indexOf('<think>')
      if (open < 0) {
        // Hold a trailing piece that might be the start of "<think>".
        const lt = buf.lastIndexOf('<')
        if (lt >= 0 && '<think>'.startsWith(buf.slice(lt))) {
          out += buf.slice(0, lt)
          buf = buf.slice(lt)
          return out
        }
        out += buf
        buf = ''
        return out
      }
      out += buf.slice(0, open)
      buf = buf.slice(open + 7)
      inThink = true
    }
  }

  let pending = '' // text already free of think blocks, not yet shown
  // Nothing shown yet: the blank lines an emptied think block leaves are dropped.
  let started = false
  const lead = (s: string) => {
    if (started) return s
    const t = s.replace(/^\s+/, '')
    if (t) started = true
    return t
  }
  const mayBeCards = (line: string) => {
    const head = line.trimStart().toUpperCase()
    return head.length < TAG.length ? TAG.startsWith(head) : head.startsWith(TAG)
  }

  return {
    push(delta: string): string {
      buf += delta
      pending += stripThink()
      const nl = pending.lastIndexOf('\n')
      const done = pending.slice(0, nl + 1)
      const tail = pending.slice(nl + 1)
      // Whole lines go out unless one is the CARDS line (kept for end()).
      const lines = done.split('\n')
      let shown = ''
      let kept = ''
      lines.forEach((l, i) => {
        if (i === lines.length - 1) return
        if (l.trimStart().toUpperCase().startsWith(TAG)) kept += l + '\n'
        else shown += l + '\n'
      })
      if (tail && !mayBeCards(tail)) {
        shown += tail
        pending = kept
      } else pending = kept + tail
      return lead(shown)
    },
    end(): { text: string; ids: string[] } {
      pending += stripThink() + (inThink ? '' : buf)
      buf = ''
      const ids: string[] = []
      const text = pending
        .split('\n')
        .filter((l) => {
          const m = /^\s*CARDS:\s*(.*)$/i.exec(l)
          if (m) m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => ids.push(id))
          return !m
        })
        .join('\n')
      pending = ''
      return { text: lead(text), ids }
    },
  }
}
