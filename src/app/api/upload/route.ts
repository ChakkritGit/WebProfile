import { randomUUID } from 'node:crypto'
import { STORAGE_BUCKET, getSupabaseAdmin, missingStorageEnv, publicUrlFor } from '@/lib/supabase'
import { StudioError, jsonError, requireOwner } from '@/lib/studio-service'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

function client() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new StudioError(
      `Image storage is not configured. Set ${missingStorageEnv().join(' and ')} in .env, then create a public Supabase Storage bucket named "${STORAGE_BUCKET}".`,
      503,
    )
  }
  return supabase
}

async function store(bytes: ArrayBuffer, contentType: string) {
  const extension = ALLOWED_TYPES[contentType]
  if (!extension) {
    throw new StudioError(
      `Unsupported image type "${contentType}". Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}.`,
      415,
    )
  }
  if (bytes.byteLength > MAX_BYTES) {
    throw new StudioError(`Image is larger than ${MAX_BYTES / 1024 / 1024} MB.`, 413)
  }

  const supabase = client()
  const path = `uploads/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType, cacheControl: '31536000', upsert: false })

  if (error) throw new StudioError(`Upload failed: ${error.message}`, 502)

  // Editor.js expects exactly this envelope from an image uploader.
  return Response.json({ success: 1, file: { url: publicUrlFor(supabase, path) } })
}

/**
 * POST /api/upload
 * - multipart/form-data with an `image` field  → Editor.js `uploadByFile`
 * - application/json `{ url }`                 → Editor.js `uploadByUrl`
 */
export async function POST(request: Request) {
  try {
    await requireOwner()
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('image')
      if (!(file instanceof File)) throw new StudioError('No image field in the request.', 400)
      return await store(await file.arrayBuffer(), file.type)
    }

    if (contentType.includes('application/json')) {
      const { url } = (await request.json()) as { url?: string }
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new StudioError('Provide an absolute http(s) image URL.', 400)
      }

      // Re-host the remote image so published posts don't depend on someone
      // else's server staying up (and don't leak referrers to it).
      const upstream = await fetch(url, { redirect: 'follow' })
      if (!upstream.ok) throw new StudioError(`Could not fetch ${url} (${upstream.status}).`, 400)

      const remoteType = upstream.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
      return await store(await upstream.arrayBuffer(), remoteType)
    }

    throw new StudioError('Send multipart/form-data or application/json.', 415)
  } catch (error) {
    // Editor.js reads `success: 0` to show an inline failure message.
    if (error instanceof StudioError) {
      return Response.json({ success: 0, error: error.message }, { status: error.status })
    }
    return jsonError(error)
  }
}
