import { listPosts, listProjects } from './content'
import { documentToText } from './editor'
import { absoluteUrl, siteDescription } from './seo'
import { profile } from '@/config/site'
import { routing } from '@/i18n/routing'
import { formatDate } from './utils'
import type { PostRecord, ProjectRecord } from './content-types'

/**
 * The site as a document, for something that reads rather than browses.
 *
 * Two files come out of here. `/llms.txt` is the index llmstxt.org describes —
 * a heading, a summary, then links with a sentence each. `/llms-full.txt` is the
 * same index followed by every piece in full, for a reader that would otherwise
 * fetch thirty pages of HTML to get thirty articles out of them.
 *
 * Both are written from the database rather than kept by hand, which is the only
 * way a file like this stays true: the first version claimed the site was
 * bilingual while listing three languages, because it was a sentence somebody
 * typed instead of a fact somebody read.
 */

const LOCALE = routing.defaultLocale

/** `- [name](url): notes`, the shape the spec asks for. */
function line(title: string, url: string, notes?: string | null) {
  const tail = notes?.replace(/\s+/g, ' ').trim()
  return `- [${title}](${url})${tail ? `: ${tail}` : ''}`
}

/** A heading and its lines, or nothing — an empty section promises and fails. */
function section(heading: string, lines: string[]) {
  return lines.length ? [`## ${heading}`, '', ...lines, ''] : []
}

function postUrl(post: PostRecord) {
  return absoluteUrl(`/blog/${post.slug}`, LOCALE)
}

function projectUrl(project: ProjectRecord) {
  return absoluteUrl(`/projects/${project.slug}`, LOCALE)
}

/**
 * Every tag in use, most-used first.
 *
 * Read off the work rather than typed out, so it cannot drift from what is
 * actually written about — and so a subject that stops appearing stops being
 * claimed.
 */
function topics(items: { tags?: string[] }[]) {
  const counted = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags ?? []) counted.set(tag, (counted.get(tag) ?? 0) + 1)
  }
  return [...counted.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, n]) => `- ${tag}${n > 1 ? ` (${n})` : ''}`)
}

async function gather() {
  const [posts, projects] = await Promise.all([
    listPosts({ locale: LOCALE, limit: 200 }),
    listProjects({ locale: LOCALE, limit: 200 }),
  ])
  return { posts, projects }
}

function header() {
  return [
    `# ${profile.name} — ${profile.role}`,
    '',
    `> ${siteDescription(LOCALE)}`,
    '',
    // The languages are counted from the routing table, so this sentence cannot
    // disagree with the site again.
    `เว็บไซต์ส่วนตัว ${routing.locales.length} ภาษา (${routing.locales.join(', ')}) รวมบทความและโปรเจกต์ด้านการพัฒนาเว็บ`,
    `ภาษาหลักคือ ${LOCALE} และลิงก์ด้านล่างเป็นฉบับภาษานั้น หน้าเดียวกันมีในภาษาอื่นภายใต้ /en และ /ja`,
    `ผู้เขียน: ${profile.name} (${profile.role}) ที่ ${profile.company}, ${profile.location}`,
    '',
  ]
}

function otherPages() {
  return [
    line('หน้าแรก', absoluteUrl('/', LOCALE)),
    line('โปรไฟล์', absoluteUrl('/about', LOCALE)),
    line('ติดต่อ', absoluteUrl('/contact', LOCALE)),
    line('หัวข้อทั้งหมด', absoluteUrl('/topics', LOCALE)),
    line('RSS', absoluteUrl('/feed.xml', LOCALE)),
    line('ฉบับเต็มของไฟล์นี้', absoluteUrl('/llms-full.txt', LOCALE)),
  ]
}

export async function llmsIndex(): Promise<string> {
  const { posts, projects } = await gather()

  // Most-read first, and only what has actually been read: a recommendation
  // nobody has opened is not a recommendation.
  const recommended = [...posts]
    .filter((post) => post.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return [
    ...header(),
    ...section('Articles', posts.map((post) => line(post.title, postUrl(post), post.summary))),
    ...section(
      'Projects',
      projects.map((project) => line(project.title, projectUrl(project), project.summary)),
    ),
    ...section('Technical Topics', topics([...posts, ...projects])),
    ...section(
      'Recommended Reading',
      recommended.map((post) => line(post.title, postUrl(post), post.summary)),
    ),
    ...section('Other', otherPages()),
  ].join('\n')
}

/** One piece, whole: what it is, then what it says. */
function full(
  title: string,
  url: string,
  content: unknown,
  meta: { date?: string | null; tags?: string[]; summary?: string | null },
) {
  // Headings inside a piece are pushed a level down, so the `##` that starts a
  // piece always outranks anything within it. Without this an article's own
  // "## Documentation" was indistinguishable from the next article's title.
  const body = documentToText(content as never)
    .trim()
    .replace(/^(#{1,5}) /gm, '#$1 ')
  return [
    `## ${title}`,
    '',
    url,
    [meta.date ? formatDate(meta.date, LOCALE) : null, meta.tags?.length ? meta.tags.join(', ') : null]
      .filter(Boolean)
      .join(' · '),
    '',
    meta.summary?.trim() ? `> ${meta.summary.replace(/\s+/g, ' ').trim()}\n` : '',
    body,
    '',
    '---',
    '',
  ]
    .filter((part) => part !== '')
    .join('\n')
}

export async function llmsFull(): Promise<string> {
  const { posts, projects } = await gather()

  return [
    ...header(),
    'ไฟล์นี้คือฉบับเต็ม: ดัชนีเดียวกับ /llms.txt ตามด้วยเนื้อหาทั้งหมดของทุกชิ้น',
    '',
    ...section('Articles', posts.map((post) => line(post.title, postUrl(post), post.summary))),
    ...section(
      'Projects',
      projects.map((project) => line(project.title, projectUrl(project), project.summary)),
    ),
    ...section('Technical Topics', topics([...posts, ...projects])),
    '# Full text',
    '',
    ...posts.map((post) =>
      full(post.title, postUrl(post), post.content, {
        date: post.publishedAt,
        tags: post.tags,
        summary: post.summary,
      }),
    ),
    ...projects.map((project) =>
      full(project.title, projectUrl(project), project.content, {
        date: project.publishedAt,
        tags: project.tags,
        summary: project.summary,
      }),
    ),
  ].join('\n')
}
