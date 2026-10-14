/**
 * Uploaded media (studio images and attachments) on our own server.
 *
 * Files live in the media service on the VPS and are public at `${NEXT_PUBLIC_MEDIA_URL}/<path>`
 * (https://chakkritton.com/media/...). Writing and deleting go to its internal address with a token,
 * and only from the studio routes, which have already passed `requireOwner()`.
 * (Before 2026-10-15 this was a public Supabase Storage bucket.)
 */

/** Public base of every stored file, e.g. https://chakkritton.com/media */
export const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL ?? '').replace(/\/+$/, '')

export type MediaStore = {
  put(path: string, bytes: ArrayBuffer, contentType: string): Promise<void>
  remove(paths: string[]): Promise<void>
}

/** Returns `null` when the store is not configured, so callers can answer 503 instead of crashing. */
export function mediaStore(): MediaStore | null {
  const base = process.env.MEDIA_INTERNAL_URL?.replace(/\/+$/, '')
  const token = process.env.MEDIA_TOKEN
  if (!base || !token || !MEDIA_URL) return null
  const call = async (method: string, path: string, init: RequestInit = {}) => {
    const r = await fetch(`${base}/internal/media/${path.split('/').map(encodeURIComponent).join('/')}`, {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), 'x-media-token': token },
      signal: AbortSignal.timeout(30_000),
    })
    if (!r.ok && !(method === 'DELETE' && r.status === 404)) throw new Error(`media ${method} ${r.status}`)
  }
  return {
    put: (path, bytes, contentType) => call('PUT', path, { body: bytes, headers: { 'content-type': contentType } }),
    async remove(paths) {
      for (const path of paths) await call('DELETE', path)
    },
  }
}

/** Names the env vars that are still missing, for the 503 body. */
export function missingStorageEnv(): string[] {
  return ['NEXT_PUBLIC_MEDIA_URL', 'MEDIA_INTERNAL_URL', 'MEDIA_TOKEN'].filter((name) => !process.env[name])
}

/** Public URL for a stored file. */
export function publicUrlFor(path: string): string {
  return `${MEDIA_URL}/${path}`
}

/**
 * The stored path behind one of our own public URLs, or `null` for anything else.
 *
 * Covers may also be pasted in as links to images we do not host; those must
 * never be treated as ours to delete, so the prefix has to match exactly.
 */
export function storagePathFromUrl(url: string): string | null {
  if (!MEDIA_URL) return null
  const prefix = `${MEDIA_URL}/`
  if (!url.startsWith(prefix)) return null
  const path = url.slice(prefix.length).split(/[?#]/)[0]
  return path ? decodeURIComponent(path) : null
}

/**
 * Whether `next/image` should resize this picture.
 *
 * Only our own uploads - anything else is on a host outside `remotePatterns`,
 * where the optimiser answers 400. And never a GIF: resized, it comes back as a
 * still of its first frame, and an animated GIF is posted for its animation.
 */
export function optimisable(url: string): boolean {
  return Boolean(storagePathFromUrl(url)) && !/\.gif$/i.test(url.split(/[?#]/)[0])
}
