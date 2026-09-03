/** Shrink a picture in the browser before it is sent anywhere. */

const TARGET_BYTES = 1024 * 1024

/** Long-edge caps to try, largest first. */
const EDGES = [2400, 1900, 1500, 1200, 900]

/** Qualities to try at each size, best first. */
const QUALITIES = [0.86, 0.74, 0.62, 0.5]

/**
 * Types a canvas would ruin: vectors would be rasterised and lose their point,
 * and an animation would come back as its first frame.
 */
const PASS_THROUGH = new Set(['image/svg+xml', 'image/gif'])

function renamed(name: string) {
  const stem = name.replace(/\.[^.]+$/, '') || 'image'
  return `${stem}.webp`
}

/**
 * Re-encode a picture to WebP, small enough to send.
 *
 * It walks two ladders: the long edge comes down first, and at each size the
 * quality comes down, stopping the moment something fits. That ordering keeps
 * the picture as large as it can be — dropping quality is less visible than
 * dropping pixels, so quality is spent first at every size.
 *
 * Anything already small enough is returned untouched, as is anything a canvas
 * would ruin or the browser cannot decode. If nothing reaches the target the
 * smallest attempt still goes back, since it beats sending the original.
 */
export async function compressImage(file: File, targetBytes = TARGET_BYTES): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (PASS_THROUGH.has(file.type)) return file
  if (file.size <= targetBytes) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }

  let best: Blob | null = null

  try {
    for (const edge of EDGES) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      for (const quality of QUALITIES) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/webp', quality)
        })
        // A browser without WebP encoding hands back a PNG instead, which will
        // not shrink the way this expects — better to send the original.
        if (!blob || blob.type !== 'image/webp') return best ? toFile(best, file) : file
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= targetBytes) return toFile(blob, file)
      }

      // Already at native size and still too big — shrinking further is the only
      // thing left, so carry on down the ladder.
      if (scale === 1 && edge !== EDGES[EDGES.length - 1]) continue
    }
    return best ? toFile(best, file) : file
  } finally {
    bitmap.close()
  }
}

function toFile(blob: Blob, from: File) {
  return new File([blob], renamed(from.name), { type: 'image/webp', lastModified: Date.now() })
}
