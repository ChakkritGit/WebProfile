import type { MetadataRoute } from 'next'

import { listPosts, listProjects } from '@/lib/content'
import { absoluteUrl, languageAlternates } from '@/lib/seo'
import { routing, type Locale } from '@/i18n/routing'

// Content is database-backed, so refresh the sitemap rather than freezing it
// into the build output.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]
type ChangeFrequency = NonNullable<Entry['changeFrequency']>
type LanguageMap = NonNullable<NonNullable<Entry['alternates']>['languages']>

/** The shape the sitemap needs from a post or a project. */
interface ContentEntry {
  slug: string
  locale: Locale
  translationKey: string | null
  updatedAt: string
}

const STATIC_ROUTES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/projects', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
]

/** One URL per locale, each pointing at the same hreflang cluster. */
function localizedEntries(
  path: string,
  lastModified: Date,
  changeFrequency: ChangeFrequency,
  priority: number,
): MetadataRoute.Sitemap {
  const languages: LanguageMap = languageAlternates(path)
  return routing.locales.map((locale) => ({
    url: absoluteUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

/**
 * Records only get an hreflang alternate when a translation actually exists —
 * slugs differ per locale, and pointing at a missing page is worse than
 * pointing at nothing.
 */
function contentEntries(
  base: string,
  rows: Record<Locale, ContentEntry[]>,
  changeFrequency: ChangeFrequency,
  priority: number,
): MetadataRoute.Sitemap {
  const byTranslationKey = new Map<string, ContentEntry>()
  for (const locale of routing.locales) {
    for (const row of rows[locale]) {
      if (row.translationKey) byTranslationKey.set(`${locale}:${row.translationKey}`, row)
    }
  }

  const entries: MetadataRoute.Sitemap = []
  for (const locale of routing.locales) {
    for (const row of rows[locale]) {
      const path = `${base}/${row.slug}`
      const languages: LanguageMap = { [locale]: absoluteUrl(path, locale) }

      for (const other of routing.locales) {
        if (other === locale || !row.translationKey) continue
        const twin = byTranslationKey.get(`${other}:${row.translationKey}`)
        if (twin) languages[other] = absoluteUrl(`${base}/${twin.slug}`, other)
      }
      if (languages[routing.defaultLocale]) {
        languages['x-default'] = languages[routing.defaultLocale]
      }

      entries.push({
        url: absoluteUrl(path, locale),
        lastModified: new Date(row.updatedAt),
        changeFrequency,
        priority,
        alternates: { languages },
      })
    }
  }
  return entries
}

function newest(rows: ContentEntry[][]): Date {
  const times = rows.flat().map((row) => new Date(row.updatedAt).getTime())
  const max = times.length ? Math.max(...times) : Number.NaN
  return Number.isFinite(max) ? new Date(max) : new Date()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Record<Locale, ContentEntry[]> = { th: [], en: [], ja: [] }
  let projects: Record<Locale, ContentEntry[]> = { th: [], en: [], ja: [] }

  // `listPosts`/`listProjects` already fall back to seed content, but a sitemap
  // that throws takes the whole build down — degrade to the static routes.
  try {
    // `exactLocale`: the sitemap pairs the two corpora by `translationKey` to emit
    // hreflang, so it needs each language on its own rather than one merged list.
    const [thPosts, enPosts, thProjects, enProjects] = await Promise.all([
      listPosts({ locale: 'th', exactLocale: true }),
      listPosts({ locale: 'en', exactLocale: true }),
      listProjects({ locale: 'th', exactLocale: true }),
      listProjects({ locale: 'en', exactLocale: true }),
    ])
    // Japanese is a UI translation over the English corpus, so it lists the
    // same entries under its own prefix.
    posts = { th: thPosts, en: enPosts, ja: enPosts }
    projects = { th: thProjects, en: enProjects, ja: enProjects }
  } catch (error) {
    console.error('[sitemap] could not read content, emitting static routes only:', error)
  }

  const lastModified = newest([posts.th, posts.en, projects.th, projects.en])

  return [
    ...STATIC_ROUTES.flatMap((route) =>
      localizedEntries(route.path, lastModified, route.changeFrequency, route.priority),
    ),
    ...contentEntries('/projects', projects, 'monthly', 0.7),
    ...contentEntries('/blog', posts, 'monthly', 0.7),
  ]
}
