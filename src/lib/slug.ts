/**
 * Slugs and heading anchors.
 *
 * Thai characters are kept as-is: they are valid in URLs once percent-encoded
 * and browsers render them decoded, which beats transliterating to gibberish.
 */

export function slugify(input: string, fallback = 'section'): string {
  const slug = input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    // keep latin letters, digits, Thai block, spaces and hyphens
    .replace(/[^a-z0-9฀-๿\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || fallback
}

/** Deterministic short suffix, used to disambiguate repeated heading text. */
function shortHash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 4)
}

/**
 * Assigns a unique slug within a document. Repeats get a `-2`, `-3`… suffix so
 * TOC links stay stable when headings are reordered but not renamed.
 */
export function uniqueSlug(base: string, taken: Set<string>, fallback = 'section'): string {
  const root = slugify(base, fallback)
  if (!taken.has(root)) {
    taken.add(root)
    return root
  }
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }
  const candidate = `${root}-${shortHash(base)}`
  taken.add(candidate)
  return candidate
}
