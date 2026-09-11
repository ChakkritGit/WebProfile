import 'dotenv/config'
import sharp from 'sharp'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

/**
 * Gives every stored image block the dimensions it never recorded.
 *
 * `/api/upload` used to answer with a URL and nothing else, so image blocks
 * saved before that was fixed carry no `width`/`height` and the renderer falls
 * back to 16:9. A wide picture therefore reserves a box it does not fill: on one
 * article a picture reserved 198px, loaded 85px tall, and took 113px out of the
 * page as the reader scrolled past it.
 *
 * Nothing but `file.width` and `file.height` is touched, and only where both are
 * missing — an author who set them by hand keeps them.
 *
 *   npx tsx scripts/backfill-image-sizes.ts          # says what it would do
 *   npx tsx scripts/backfill-image-sizes.ts --write  # does it
 */

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Fill in .env first.')
  process.exit(1)
}

const write = process.argv.includes('--write')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

type ImageFile = { url?: string; width?: number; height?: number }
type Block = { type?: string; data?: { file?: ImageFile; url?: string } }
type Document = { blocks?: Block[] }

/** Dimensions of a picture we do not have on disk, or `null` if it cannot be read. */
async function measure(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    return meta.width && meta.height ? { width: meta.width, height: meta.height } : null
  } catch {
    return null
  }
}

/**
 * Fills in the blocks of one record, in place.
 *
 * Returns what it changed rather than whether it changed, so the dry run can
 * print the same list the write would apply.
 */
async function fill(document: Document): Promise<string[]> {
  const filled: string[] = []

  for (const block of document.blocks ?? []) {
    if (block.type !== 'image') continue
    const file = block.data?.file
    const url = file?.url ?? block.data?.url
    if (!url || (file?.width && file?.height)) continue

    const size = await measure(url)
    if (!size) {
      filled.push(`  ? ${url.split('/').pop()} — could not be read`)
      continue
    }
    if (block.data && !block.data.file) block.data.file = { url }
    Object.assign(block.data!.file!, size)
    filled.push(`  + ${url.split('/').pop()} → ${size.width}x${size.height}`)
  }

  return filled
}

async function main() {
  const [posts, projects] = await Promise.all([
    prisma.post.findMany({ select: { id: true, slug: true, locale: true, content: true } }),
    prisma.project.findMany({ select: { id: true, slug: true, locale: true, content: true } }),
  ])

  let changed = 0
  for (const [kind, rows] of [
    ['post', posts],
    ['project', projects],
  ] as const) {
    for (const row of rows) {
      const document = row.content as Document
      const filled = await fill(document)
      // A line starting with `+` is a block that now has a size; `?` could not be
      // read and is left exactly as it was.
      const wrote = filled.filter((line) => line.startsWith('  +')).length
      if (filled.length === 0) continue

      console.log(`${kind} ${row.locale}/${row.slug}`)
      console.log(filled.join('\n'))

      if (wrote === 0) continue
      changed += wrote
      if (!write) continue

      const data = { content: document as never }
      if (kind === 'post') await prisma.post.update({ where: { id: row.id }, data })
      else await prisma.project.update({ where: { id: row.id }, data })
    }
  }

  console.log(
    changed === 0
      ? '\nNothing to fill in.'
      : write
        ? `\n${changed} image block(s) filled in.`
        : `\n${changed} image block(s) would be filled in. Run again with --write.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
