import { randomUUID } from 'node:crypto'
import { STORAGE_BUCKET, getSupabaseAdmin, missingStorageEnv, publicUrlFor } from '@/lib/supabase'
import { StudioError, jsonError, requireOwner } from '@/lib/studio-service'

/**
 * File attachments for Editor.js's attaches tool.
 *
 * Separate from `/api/upload` rather than folded into it. That one re-hosts
 * images so a published post does not depend on somebody else's server staying
 * up, and answers with the one field the image tool reads. This one keeps a file
 * to be downloaded, and has to answer with its name, size and extension — the
 * card in the article is built from those. Two different jobs behind one
 * endpoint would have meant a union of two shapes and a flag to tell them apart.
 */

const MAX_BYTES = 25 * 1024 * 1024

/**
 * What may be stored, by extension rather than by the browser's guess at a type:
 * the type is what the uploader claims, the extension is what the file will be
 * served as.
 *
 * No `html`, `svg`, `js` or anything else a browser executes. The bucket is
 * public and serves what it is given, so an executable document there would run
 * on the storage origin with whatever that origin can reach.
 */
const ALLOWED = new Set([
  'pdf',
  'doc',
  'docx',
  'odt',
  'rtf',
  'txt',
  'md',
  'csv',
  'xls',
  'xlsx',
  'ods',
  'ppt',
  'pptx',
  'odp',
  'zip',
  'gz',
  'tar',
  'json',
  'xml',
  'mp3',
  'wav',
  'mp4',
  'webm',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
])

function extensionOf(name: string) {
  const dot = name.lastIndexOf('.')
  if (dot < 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/**
 * POST /api/attach
 *
 * multipart/form-data with a `file` field. Answers with the envelope the
 * attaches tool expects: `{ success: 1, file: { url, name, size, extension } }`.
 */
export async function POST(request: Request) {
  try {
    await requireOwner()

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      throw new StudioError('Send the file as multipart/form-data.', 415)
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new StudioError('No file field in the request.', 400)

    const extension = extensionOf(file.name)
    if (!ALLOWED.has(extension)) {
      throw new StudioError(
        `Files of type "${extension || 'unknown'}" are not accepted. Allowed: ${[...ALLOWED].join(', ')}.`,
        415,
      )
    }
    if (file.size > MAX_BYTES) {
      throw new StudioError(`File is larger than ${MAX_BYTES / 1024 / 1024} MB.`, 413)
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new StudioError(
        `File storage is not configured. Set ${missingStorageEnv().join(' and ')} in .env, then create a public Supabase Storage bucket named "${STORAGE_BUCKET}".`,
        503,
      )
    }

    // The stored name is a uuid, never the uploaded one: a filename can carry
    // path separators, unicode that renders as something else, or simply
    // somebody else's name for a file. The original travels in the response and
    // is what the card shows.
    const path = `attachments/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) throw new StudioError(`Upload failed: ${error.message}`, 502)

    return Response.json({
      success: 1,
      file: {
        url: publicUrlFor(supabase, path),
        name: file.name,
        size: file.size,
        extension,
      },
    })
  } catch (error) {
    if (error instanceof StudioError) {
      return Response.json({ success: 0, error: error.message }, { status: error.status })
    }
    return jsonError(error)
  }
}
