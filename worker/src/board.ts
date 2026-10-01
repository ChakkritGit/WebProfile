import type { Lang } from './types'

export type Mode = 'plan' | 'summary' | 'tidy'
export interface DigestItem {
  id: string
  kind: string
  text: string
  x: number
  y: number
  frame?: string
}
export interface BoardBody {
  mode: Mode
  lang: Lang
  request: string
  items: DigestItem[]
}

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function parseBoardBody(raw: string): BoardBody | null {
  let b: unknown
  try {
    b = JSON.parse(raw)
  } catch {
    return null
  }
  const o = (b ?? {}) as { mode?: unknown; lang?: unknown; request?: unknown; board?: { items?: unknown } }
  if (o.mode !== 'plan' && o.mode !== 'summary' && o.mode !== 'tidy') return null
  if (o.lang !== 'th' && o.lang !== 'en') return null
  if (typeof o.request !== 'string') return null
  const request = o.request.trim()
  if (!request || request.length > 500) return null
  const raws = o.board?.items
  if (!Array.isArray(raws) || raws.length > 120) return null
  const items: DigestItem[] = []
  for (const r of raws) {
    const { id, kind, text, x, y, frame } = (r ?? {}) as Record<string, unknown>
    if (!str(id, 64) || !str(kind, 16) || !str(text, 120) || !num(x) || !num(y)) return null
    if (frame !== undefined && !str(frame, 64)) return null
    items.push(frame === undefined ? { id, kind, text, x, y } : { id, kind, text, x, y, frame })
  }
  return { mode: o.mode, lang: o.lang, request, items }
}

/** The first balanced `{...}` in the model's text, after its think block is cut. Braces inside JSON strings do not count. */
export function extractJson(text: string): unknown | null {
  const t = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '')
  const start = t.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  for (let i = start; i < t.length; i++) {
    const c = t[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === '"') inStr = false
    } else if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) {
      try {
        return JSON.parse(t.slice(start, i + 1))
      } catch {
        return null
      }
    }
  }
  return null
}

export type Plan =
  | { type: 'kanban'; title: string; columns: { title: string; cards: string[] }[] }
  | { type: 'timeline'; title: string; milestones: { title: string; note?: string }[] }
  | { type: 'flowchart'; title: string; nodes: { id: string; label: string; shape: Shape }[]; edges: { from: string; to: string; label?: string }[] }
type Shape = 'start' | 'process' | 'decision' | 'end'
const SHAPES = ['start', 'process', 'decision', 'end']
export interface Group {
  title: string
  ids: string[]
}

const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max).trim() : '')
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

export function clampPlan(v: unknown): Plan | null {
  const o = (v ?? {}) as { type?: unknown; title?: unknown; columns?: unknown; milestones?: unknown; nodes?: unknown; edges?: unknown }
  const title = clean(o.title)
  if (o.type === 'kanban') {
    const columns = arr(o.columns)
      .map((c) => {
        const col = (c ?? {}) as { title?: unknown; cards?: unknown }
        return { title: clean(col.title), cards: arr(col.cards).map((c) => clean(c)).filter(Boolean).slice(0, 8) }
      })
      .filter((c) => c.title)
      .slice(0, 6)
    return columns.length ? { type: 'kanban', title, columns } : null
  }
  if (o.type === 'timeline') {
    const milestones = arr(o.milestones)
      .map((m) => {
        const ms = (m ?? {}) as { title?: unknown; note?: unknown }
        const note = clean(ms.note)
        return note ? { title: clean(ms.title), note } : { title: clean(ms.title) }
      })
      .filter((m) => m.title)
      .slice(0, 10)
    return milestones.length ? { type: 'timeline', title, milestones } : null
  }
  if (o.type === 'flowchart') {
    const seen = new Set<string>()
    const nodes: { id: string; label: string; shape: Shape }[] = []
    for (const n of arr(o.nodes)) {
      const { id: rawId, label: rawLabel, shape } = (n ?? {}) as { id?: unknown; label?: unknown; shape?: unknown }
      const id = clean(rawId, 16)
      const label = clean(rawLabel)
      if (!id || !label || seen.has(id) || nodes.length >= 14) continue
      seen.add(id)
      nodes.push({ id, label, shape: SHAPES.includes(shape as string) ? (shape as Shape) : 'process' })
    }
    const pairs = new Set<string>()
    const edges: { from: string; to: string; label?: string }[] = []
    for (const e of arr(o.edges)) {
      const { from: f, to: t, label: l } = (e ?? {}) as { from?: unknown; to?: unknown; label?: unknown }
      const from = clean(f, 16)
      const to = clean(t, 16)
      const pair = `${from}\n${to}`
      if (!seen.has(from) || !seen.has(to) || from === to || pairs.has(pair) || edges.length >= 20) continue
      pairs.add(pair)
      const label = clean(l, 24)
      edges.push(label ? { from, to, label } : { from, to })
    }
    return nodes.length >= 2 && edges.length ? { type: 'flowchart', title, nodes, edges } : null
  }
  return null
}

export function filterTidy(v: unknown, ids: Set<string>): Group[] | null {
  const used = new Set<string>()
  const groups: Group[] = []
  for (const g of arr((v as { groups?: unknown } | null)?.groups)) {
    const { title, ids: raw } = (g ?? {}) as { title?: unknown; ids?: unknown }
    // The live model sometimes writes "n1,n2" for ["n1","n2"].
    const mine = (typeof raw === 'string' ? raw.split(/[\s,]+/) : arr(raw)).filter((id): id is string => typeof id === 'string' && ids.has(id) && !used.has(id))
    const keep = [...new Set(mine)]
    if (keep.length < 2) continue // its ids stay free for a later group
    keep.forEach((id) => used.add(id))
    groups.push({ title: clean(title), ids: keep })
  }
  return groups.length ? groups.slice(0, 8) : null
}
