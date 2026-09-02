/**
 * Renders the brand mark into every icon asset the site needs.
 *
 *   node scripts/generate-icons.mjs
 *
 * Everything is derived from one inline SVG so the favicon, the PWA icons and
 * the OG image never drift apart. Re-run after touching the palette below.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const INK = '#241F2E'
const CREAM = '#FFFCF7'
const CORAL = '#FF5A5F'
const MINT = '#23C4B4'

/**
 * The mark, on a 64-unit grid: a coral "C" (a 250deg arc opening to the right,
 * centred on 28,32 with r=16) holding a mint dot in its mouth. Drawn as a path
 * rather than text so it rasterises identically without any font present.
 */
const ART = `
  <path d="M37.18 18.89A16 16 0 1 0 37.18 45.11" fill="none" stroke="${CORAL}" stroke-width="10" stroke-linecap="round"/>
  <circle cx="46.5" cy="32" r="6.5" fill="${MINT}"/>
`

/** Rounded-square badge with transparent corners — favicon / browser / PWA "any". */
function badgeSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect x="2" y="2" width="60" height="60" rx="16" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>${ART}</svg>`
}

/**
 * Full-bleed cream variant for surfaces that apply their own mask (iOS home
 * screen, Android adaptive icons). `scale` shrinks the badge toward the centre
 * so nothing important lands in the area a mask can crop.
 */
function bleedSvg(size, scale) {
  const offset = (1 - scale) * 32
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" fill="${CREAM}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="${INK}" stroke-width="4"/>${ART}
  </g>
</svg>`
}

const png = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()

/**
 * Minimal ICO container. sharp cannot write .ico, but the format is just a
 * directory of images and PNG payloads are valid entries in every browser and
 * on Windows Vista+.
 */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)

  const entries = []
  let offset = 6 + images.length * 16
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // 0 encodes 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

async function main() {
  const written = []
  const emit = async (relativePath, data) => {
    const target = join(ROOT, relativePath)
    await writeFile(target, data)
    written.push(relativePath)
  }

  // Source SVG. Next picks this up as the browser icon (`sizes="any"`).
  await emit('src/app/icon.svg', `${badgeSvg(64)}\n`)

  const icoSizes = [16, 32, 48]
  const icoImages = await Promise.all(
    icoSizes.map(async (size) => ({ size, data: await png(badgeSvg(size)) })),
  )
  await emit('src/app/favicon.ico', buildIco(icoImages))

  await emit('src/app/apple-icon.png', await png(bleedSvg(180, 0.88)))
  await emit('public/icon-192.png', await png(badgeSvg(192)))
  await emit('public/icon-512.png', await png(badgeSvg(512)))
  await emit('public/icon-maskable-512.png', await png(bleedSvg(512, 0.78)))

  for (const relativePath of written) {
    if (relativePath.endsWith('.png')) {
      const { width, height, format } = await sharp(join(ROOT, relativePath)).metadata()
      console.log(`  ${relativePath} — ${format} ${width}x${height}`)
    } else {
      console.log(`  ${relativePath}`)
    }
  }
  console.log(`\n${written.length} icon assets written (ico contains ${icoSizes.join(', ')}px).`)
}

await main()
