import type { BoardBody } from './board'
import { VOICE, todayLine } from './prompt'

type Out = { role: 'system' | 'user' | 'assistant'; content: string }

const PLAN = `Return ONLY a JSON object, no prose, matching exactly one of:
{"type":"kanban","title":string,"columns":[{"title":string,"cards":string[]}]}
{"type":"timeline","title":string,"milestones":[{"title":string,"note"?:string}]}
{"type":"flowchart","title":string,"nodes":[{"id":string,"label":string,"shape":"start"|"process"|"decision"|"end"}],"edges":[{"from":string,"to":string,"label"?:string}]}
{"type":"answer","text":string}
Use answer when the request is a question or chat rather than something to draw (who built this, what can you do, show me the articles): one to three sentences in your own voice, plain text. Never invent article or project titles; for those, point to https://chakkritton.com/blog or https://chakkritton.com/projects. Anything that asks for a plan, list, timeline or flow is drawn, not answered.
Use flowchart when the request asks for a flow, flowchart, workflow, process, steps a user or system goes through, or decisions (Thai: ขั้นตอน, โฟลว์, กระบวนการ, ลำดับการทำงาน); timeline for phases and dates; kanban for task lists. A request to plan, prepare or launch something (Thai: วางแผน, เตรียม, เปิด) is a task list: use kanban, never flowchart, unless it explicitly says flow, flowchart, workflow or steps. At most 6 columns, 8 cards each, 10 milestones, 14 nodes, 20 edges. Every string under 80 characters.
Flowchart rules: exactly one start node and at least one end node. A decision node has 2 outgoing edges labelled with short answers (Yes/No, or ใช่/ไม่ in Thai). A flowchart always has at least one decision node (even a simple flow has a check, such as seat free or payment ok), shape "decision" with a label phrased as a question, for a choice or check, for example {"id":"n5","label":"Payment ok?","shape":"decision"} with edges n5 to n6 labelled Yes and n5 to n7 labelled No. Node labels are 2 to 6 words. Node ids are short, like n1, n2. Every edge uses the ids of two nodes.`
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
