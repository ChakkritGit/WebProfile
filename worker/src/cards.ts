import type { Item, Lang } from './types'

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
 * exist — so when nothing valid is left, the cards are the items the reply names
 * by title, or failing that the ones the ranking picked for the question.
 */
export function chooseCards(ids: string[], items: Item[], lang: Lang, fallback?: { text: string; ranked: string[] }): string[] {
  const chosen = pick(ids, items, lang)
  if (chosen.length || !fallback) return chosen
  const said = fallback.text.toLowerCase()
  const named = items.filter((i) => i.title.length >= 3 && said.includes(i.title.toLowerCase())).map((i) => i.id)
  return pick(named.length ? named : fallback.ranked, items, lang)
}
