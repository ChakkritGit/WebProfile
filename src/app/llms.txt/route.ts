import { listPosts, listProjects } from '@/lib/content'
import { absoluteUrl, siteDescription } from '@/lib/seo'
import { profile } from '@/config/site'
import { routing } from '@/i18n/routing'

/**
 * `/llms.txt`, as specified at llmstxt.org.
 *
 * The problem it answers: a language model reading this site gets HTML built for
 * a browser — navigation, a theme toggle, a table of contents, a footer — and has
 * to guess which part is the writing. This is the same site as an index: a
 * heading, one line of summary, then links with a sentence each, in the order a
 * person would be given them.
 *
 * Markdown rather than a new format, and served as plain text, because both of
 * those are the point: the file is meant to be read as easily by a person as by
 * a model.
 *
 * Content only, in the default locale. The translations are the same pieces
 * again, and repeating them would pad the file without adding a fact; anything
 * that wants them can follow the `hreflang` links on the page itself.
 */

// Written from the database, so a publish shows up here as it does everywhere
// else rather than being frozen into the build.
export const revalidate = 3600

/** One line per item, the shape llms.txt asks for: `- [name](url): notes`. */
function line(title: string, url: string, summary?: string | null) {
  const notes = summary?.replace(/\s+/g, ' ').trim()
  return `- [${title}](${url})${notes ? `: ${notes}` : ''}`
}

/** A heading and its lines, or nothing at all. */
function section(heading: string, lines: string[]) {
  return lines.length ? [`## ${heading}`, '', ...lines, ''] : []
}

export async function GET() {
  const locale = routing.defaultLocale
  const [posts, projects] = await Promise.all([
    listPosts({ locale, limit: 100 }),
    listProjects({ locale, limit: 100 }),
  ])

  const body = [
    `# ${profile.name} — ${profile.role}`,
    '',
    `> ${siteDescription(locale)}`,
    '',
    'เว็บไซต์ส่วนตัวสองภาษา (ไทย/อังกฤษ/ญี่ปุ่น) รวมบทความและโปรเจกต์ด้านการพัฒนาเว็บ',
    'ลิงก์ทั้งหมดด้านล่างเป็นภาษาไทยซึ่งเป็นภาษาหลักของเว็บ',
    '',
    // A heading with nothing under it tells a reader there is something here
    // and then does not deliver, so an empty section is left out entirely.
    ...section(
      'บทความ',
      posts.map((post) => line(post.title, absoluteUrl(`/blog/${post.slug}`, locale), post.summary)),
    ),
    ...section(
      'โปรเจกต์',
      projects.map((project) =>
        line(project.title, absoluteUrl(`/projects/${project.slug}`, locale), project.summary),
      ),
    ),
    '## หน้าอื่น',
    '',
    line('หน้าแรก', absoluteUrl('/', locale)),
    line('โปรไฟล์', absoluteUrl('/about', locale)),
    line('ติดต่อ', absoluteUrl('/contact', locale)),
    line('หัวข้อทั้งหมด', absoluteUrl('/topics', locale)),
    line('RSS', absoluteUrl('/feed.xml', locale)),
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      // `text/plain` rather than `text/markdown`: a browser opening the URL
      // should show the file, not download it.
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
