import { z } from 'zod'

import { routing } from '@/i18n/routing'

/**
 * Payload validation shared by the studio form and the /api/content routes.
 *
 * The schemas describe what a *client* may send. Everything derived on the
 * server (readingMinutes, publishedAt, a generated slug) is deliberately absent
 * so a request can never overwrite it.
 */

/* ------------------------------ primitives ----------------------------- */

/** Empty strings from an untouched <input> mean "no value", not "the empty value". */
const emptyToNull = <T extends z.ZodType<string | null | undefined>>(schema: T) =>
  schema.transform((value) => (value == null || value === '' ? null : value))

const optionalText = (max: number) => emptyToNull(z.string().trim().max(max).nullish())

/** Absolute http(s) URL, or a site-root-relative path such as /images/cover.png. */
const urlOrPath = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || value.startsWith('/') || /^https?:\/\/\S+$/i.test(value),
    { message: 'Must be a URL or a path starting with /' },
  )

const optionalUrl = emptyToNull(urlOrPath.nullish())

/** Accepts 2024, "2024" or "" — the year input posts whichever it has. */
const optionalYear = z
  .preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.union([z.null(), z.coerce.number().int().min(1970).max(2999)]),
  )
  .default(null)

const stringList = z
  .array(z.string().trim().min(1).max(40))
  .max(24)
  .default([])
  .transform((values) => [...new Set(values)])

/** Editor.js block payloads are open-ended by design — validate the envelope only. */
export const editorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
  tunes: z.record(z.string(), z.unknown()).optional(),
})

export const editorDocumentSchema = z.object({
  time: z.number().optional(),
  version: z.string().optional(),
  blocks: z.array(editorBlockSchema).default([]),
})

export const localeSchema = z.enum(routing.locales)
export const statusSchema = z.enum(['DRAFT', 'PUBLISHED'])
export const contentKindSchema = z.enum(['posts', 'projects'])

export type ContentKindParam = z.infer<typeof contentKindSchema>

/* -------------------------------- shared ------------------------------- */

const baseShape = {
  title: z.string().trim().min(1).max(200),
  /** Blank is valid: the server generates a unique slug from the title. */
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9฀-๿-]*$/, 'Lowercase letters, digits, Thai and hyphens only')
    .optional()
    .default(''),
  locale: localeSchema,
  translationKey: optionalText(120),
  summary: optionalText(400),
  coverImage: optionalUrl,
  tags: stringList,
  content: editorDocumentSchema,
  status: statusSchema.default('DRAFT'),
  featured: z.boolean().default(false),
}

/* -------------------------------- post --------------------------------- */

export const postSchema = z.object(baseShape)
export const postUpdateSchema = postSchema.partial()

export type PostInput = z.infer<typeof postSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>

/* ------------------------------- project ------------------------------- */

export const projectSchema = z.object({
  ...baseShape,
  role: optionalText(120),
  stack: stringList,
  year: optionalYear,
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  sortOrder: z.coerce.number().int().min(-999).max(999).default(0),
})
export const projectUpdateSchema = projectSchema.partial()

export type ProjectInput = z.infer<typeof projectSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>

/* ------------------------------- helpers ------------------------------- */

export function schemaFor(kind: ContentKindParam, partial: boolean) {
  if (kind === 'posts') return partial ? postUpdateSchema : postSchema
  return partial ? projectUpdateSchema : projectSchema
}

/** Flat `{ field: [message] }` map for the 400 response body. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join('.') : '_form'
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}

/** `"a, b , ,c"` → `['a','b','c']` — the shape the comma-separated inputs post. */
export function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
