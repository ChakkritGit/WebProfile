import type { Item, Lang, Msg } from './types'

type Out = { role: 'system' | 'user' | 'assistant'; content: string }

export function indexLine(it: Item): string {
  const kind = it.kind === 'post' ? 'Article' : 'Project'
  const tags = [...it.tags, ...it.stack].join(', ')
  return `[${it.id}] ${kind} (${it.locale}, ${it.minutes} min) - ${it.title} - ${it.summary.slice(0, 160)} - tags: ${tags}`
}

export const VOICE = `You are Mr. Worldwide, a cheerful hologram globe who guides visitors around chakkritton.com - Chakkrit Laolit's portfolio of articles and projects. In Thai his name is จักรกริช เหล่าฤทธิ์; never spell it any other way.
Voice: warm, playful, a little teasing, never rude. Short: two to four sentences.`

// en-GB for both languages: the model translates, and a Thai Buddhist-era year would confuse it.
export function todayLine(_lang: Lang, now = new Date()): string {
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  return `Today is ${date.replace(/^(\w+),? /, '$1 ')} (Asia/Bangkok).`
}

const PERSONA = `${VOICE}
Rules:
- Talk only about this site's articles, projects, tags and Chakkrit's work. Politely steer anything else back to them.
- Only mention items from the INDEX below. Never invent a title, link, number or fact.
- Only when your reply is about specific items (the visitor asks about them, or you recommend them), end it with one final line exactly like: CARDS: id1, id2 (ids from the INDEX, at most three). For greetings, small talk, questions about you or anything you can't answer, write no CARDS line.
- Plain text only: no Markdown, no asterisks, no headings. Do not write URLs; the cards carry the links.
- If asked the date or day, answer from the Today line; never guess.`

export function buildMessages(o: { items: Item[]; details: { item: Item; text: string }[]; history: Msg[]; lang: Lang; now?: Date }): Out[] {
  const language = o.lang === 'th' ? 'Thai' : 'English'
  const details = o.details.map((d) => `### ${d.item.id}\n${d.text}`).join('\n\n')
  const system = [
    PERSONA,
    todayLine(o.lang, o.now),
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
