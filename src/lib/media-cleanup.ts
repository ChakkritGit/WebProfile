import 'server-only'

import { STORAGE_BUCKET, getSupabaseAdmin, storagePathFromUrl } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

/**
 * Deleting content deletes the images it uploaded.
 *
 * Storage has no foreign keys, so nothing removed the objects when a post was
 * deleted or an image was swapped out: the bucket kept growing with files no
 * page referenced any more. This walks the record for URLs that live in our own
 * bucket, then removes the ones no surviving record still points at.
 */

/** Every one of our storage objects reachable from a record, at any depth. */
export function mediaPathsIn(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const path = storagePathFromUrl(value)
    if (path) found.add(path)
  } else if (Array.isArray(value)) {
    for (const item of value) mediaPathsIn(item, found)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) mediaPathsIn(item, found)
  }
  return found
}

/**
 * Paths still referenced by content that exists right now, or `null` when that
 * cannot be established. Returning an empty set for an unreachable database would
 * make every candidate look unreferenced and delete the lot.
 */
async function pathsInUse(): Promise<Set<string> | null> {
  if (!prisma) return null

  const inUse = new Set<string>()
  const select = { coverImage: true, content: true }
  const [posts, projects] = await Promise.all([
    prisma.post.findMany({ select }),
    prisma.project.findMany({ select }),
  ])
  for (const row of [...posts, ...projects]) mediaPathsIn(row, inUse)
  return inUse
}

/**
 * Removes `candidates` that nothing references any more. Call it *after* the
 * write, so the record's surviving state counts as a reference — a translation
 * sharing a cover image keeps that file alive.
 *
 * Never throws: losing a stale file is not worth failing the author's save, and
 * a leftover object is recoverable while a rejected edit is not.
 */
export async function pruneOrphanedMedia(candidates: Set<string>): Promise<string[]> {
  if (candidates.size === 0) return []

  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  try {
    const inUse = await pathsInUse()
    if (!inUse) return []
    const orphans = [...candidates].filter((path) => !inUse.has(path))
    if (orphans.length === 0) return []

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(orphans)
    if (error) {
      console.error('[media] could not remove orphaned uploads:', error.message)
      return []
    }
    return orphans
  } catch (error) {
    console.error('[media] orphan sweep failed:', error)
    return []
  }
}
