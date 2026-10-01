import type { BoardBody } from './board'
import { VOICE, todayLine } from './prompt'

type Out = { role: 'system' | 'user' | 'assistant'; content: string }

const PLAN = `Return ONLY a JSON object, no prose, matching exactly one of:
{"type":"kanban","title":string,"columns":[{"title":string,"cards":string[]}]}
{"type":"timeline","title":string,"milestones":[{"title":string,"note"?:string}]}
Use kanban for task lists and timeline for phases and dates. At most 6 columns, 8 cards each, 10 milestones. Every string under 80 characters.`
const SUMMARY = `Summarise the board in at most 120 words, plain text. Do not list every note: say what the board is about, its main groups, and one thing that seems missing. No Markdown: no asterisks, no headings, no bullet symbols.`
const TIDY = `Return ONLY a JSON object {"groups":[{"title":string,"ids":["id1","id2"]}]}, where ids is an array of strings, using only ids from the list. Group by topic, 2 to 8 groups, titles 1 to 4 words. Put every note that fits a topic into exactly one group; leave out only notes that fit nothing.`
const TASK = { plan: PLAN, summary: SUMMARY, tidy: TIDY }

export function boardMessages(body: BoardBody, now?: Date): Out[] {
  const language = body.lang === 'th' ? 'Thai' : 'English'
  const digest = body.items.map((i) => `${i.id} | ${i.kind} | ${i.frame ?? ''} | ${i.text}`).join('\n')
  const system = [
    VOICE,
    `For this task, ignore the sentence limit above and follow the task's own format.`,
    todayLine(body.lang, now),
    `You are looking at a shared whiteboard. Write any title, card or text in ${language}.`,
    TASK[body.mode],
    `BOARD (id | kind | frame | text):\n${digest || '(empty)'}`,
  ].join('\n\n')
  return [{ role: 'system', content: system }, { role: 'user', content: `${body.request} /no_think` }]
}
