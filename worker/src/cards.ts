import type { Item, Lang } from './types'

/**
 * The model's CARDS ids turned into what the reader sees: only ids that exist,
 * one card per piece (translations share a group), in the reader's language when
 * that version exists, in the model's order, at most three.
 */
export function chooseCards(ids: string[], items: Item[], lang: Lang): string[] {
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
