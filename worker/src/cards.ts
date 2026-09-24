import type { Item, Lang } from './types'

/**
 * The model's CARDS ids turned into what the reader sees: only ids that exist,
 * one card per piece (translations share a group), in the reader's language when
 * that version exists, in the model's order, at most three.
 *
 * The model does not always write its CARDS line. Then the cards are the items
 * the reply names by title, or failing that the ones the ranking picked.
 */
export function chooseCards(ids: string[], items: Item[], lang: Lang, fallback?: { text: string; ranked: string[] }): string[] {
  if (!ids.length && fallback) {
    const said = fallback.text.toLowerCase()
    const named = items.filter((i) => i.title.length >= 3 && said.includes(i.title.toLowerCase())).map((i) => i.id)
    ids = named.length ? named : fallback.ranked
  }
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
