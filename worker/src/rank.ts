import type { Item, Lang } from './types'

const THAI = /[\u0E00-\u0E7F]+/g
// Words every question has; matching on them made "what is the weather" find "What is llms.txt?".
const STOP = new Set('a an and any are about can do does for from has have how in is it me my of on or so some that the there this to what which who why with you your'.split(' '))

/** Latin words, and three-letter pieces of every Thai run (Thai has no spaces). */
function terms(text: string) {
  const lower = text.toLowerCase()
  const words = new Set(lower.replace(THAI, ' ').split(/[^\p{L}\p{N}.+#]+/u).filter((w) => w.length >= 2 && !STOP.has(w)))
  const grams = new Set<string>()
  for (const run of lower.match(THAI) ?? []) for (let i = 0; i + 3 <= run.length; i++) grams.add(run.slice(i, i + 3))
  return { words, grams }
}

function overlap(q: ReturnType<typeof terms>, field: string): number {
  const f = terms(field)
  let n = 0
  for (const w of q.words) if (f.words.has(w) || (w.length >= 4 && [...f.words].some((x) => x.startsWith(w)))) n += 1
  for (const g of q.grams) if (f.grams.has(g)) n += 0.34
  return n
}

/** Items that match the question, best first: title counts most, then tags, then summary. `min` 2 asks for a title or tag hit. */
export function rank(items: Item[], query: string, lang: Lang, min = 1): Item[] {
  const q = terms(query)
  return items
    .map((it) => ({
      it,
      score:
        3 * overlap(q, it.title) +
        2 * overlap(q, [...it.tags, ...it.stack].join(' ')) +
        overlap(q, it.summary) +
        (it.locale === lang ? 0.25 : 0),
    }))
    .filter((x) => x.score >= min)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it)
}
