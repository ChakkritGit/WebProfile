import { rank } from './rank'
import type { Item, Lang } from './types'

// "Show me all the articles", "โปรเจกต์ล่าสุด"…
const ALL = /(ทั้งหมด|ทุก|ล่าสุด|\ball\b|\bevery|\blatest\b|\brecent|\blist\b)/i
const POSTS = /(บทความ|โพสต์|article|\bposts?\b|blog)/i
const PROJECTS = /(โปรเจกต์|โปรเจค|ผลงาน|project)/i

/** Only ids that exist, one per piece (translations share a group), in the reader's language when it exists, at most three. */
function pick(ids: string[], items: Item[], lang: Lang): string[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const it = byId.get(id)
    // An index from before groups existed: every item is its own piece.
    const group = it?.group ?? id
    if (!it || seen.has(group)) continue
    seen.add(group)
    const own = it.group ? items.find((x) => x.group === it.group && x.locale === lang) : undefined
    out.push((own ?? it).id)
    if (out.length === 3) break
  }
  return out
}

/**
 * The model's CARDS ids turned into what the reader sees. The model does not
 * always get its CARDS line right — it leaves it out, or writes ids that do not
 * exist — so when nothing valid is left, the cards are, in turn: the items the
 * reply names by title; the ones whose titles or tags it talks about ("llms.txt",
 * "macOS"); the ones the ranking picked for the question; and, when the question
 * asks for all or the latest articles or projects, the latest of those.
 */
export function chooseCards(ids: string[], items: Item[], lang: Lang, fallback?: { text: string; ranked: string[]; question?: string }): string[] {
  const chosen = pick(ids, items, lang)
  if (chosen.length || !fallback) return chosen
  const said = fallback.text.toLowerCase()
  const named = items.filter((i) => i.title.length >= 3 && said.includes(i.title.toLowerCase())).map((i) => i.id)
  if (named.length) return pick(named, items, lang)
  const talked = rank(items, fallback.text, lang, 2).map((i) => i.id)
  if (talked.length) return pick(talked, items, lang)
  if (fallback.ranked.length) return pick(fallback.ranked, items, lang)
  const q = fallback.question ?? ''
  if (!ALL.test(q)) return []
  const kinds = new Set([...(POSTS.test(q) ? ['post'] : []), ...(PROJECTS.test(q) ? ['project'] : [])])
  return pick(items.filter((i) => kinds.has(i.kind)).map((i) => i.id), items, lang) // the index is newest first
}
