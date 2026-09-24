import type { Item, Lang, Msg } from './types'

type Out = { role: 'system' | 'user' | 'assistant'; content: string }

export function indexLine(it: Item): string {
  const kind = it.kind === 'post' ? 'Article' : 'Project'
  const tags = [...it.tags, ...it.stack].join(', ')
  return `[${it.id}] ${kind} (${it.locale}, ${it.minutes} min) — ${it.title} — ${it.summary.slice(0, 160)} — tags: ${tags}`
}

const PERSONA = `You are Mr. Worldwide, a cheerful hologram globe who guides visitors around chakkritton.com — Chakkrit Laolit's portfolio of articles and projects.
Voice: warm, playful, a little teasing, never rude. Short: two to four sentences.
Rules:
- Talk only about this site's articles, projects, tags and Chakkrit's work. Politely steer anything else back to them.
- Only mention items from the INDEX below. Never invent a title, link, number or fact.
- When you recommend items, end your reply with one final line exactly like: CARDS: id1, id2 (ids from the INDEX, at most three). Otherwise write no CARDS line.
- Do not write URLs; the cards carry the links.`

export function buildMessages(o: { items: Item[]; details: { item: Item; text: string }[]; history: Msg[]; lang: Lang }): Out[] {
  const language = o.lang === 'th' ? 'Thai' : 'English'
  const details = o.details.map((d) => `### ${d.item.id}\n${d.text}`).join('\n\n')
  const system = [
    PERSONA,
    `Reply in ${language} unless the visitor clearly writes in another language.`,
    `INDEX:\n${o.items.map(indexLine).join('\n')}`,
    details ? `DETAILS (quote from these when asked):\n${details}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const history = o.history.slice(-8).map((m) => ({ role: m.role, content: m.content }))
  const last = history.at(-1)
  if (last && last.role === 'user') last.content = `${last.content} /no_think`
  return [{ role: 'system', content: system }, ...history]
}
