/**
 * Saves the rare-script faces, cut by Google to exactly WORLD_GLYPHS, into
 * src/assets/fonts/world — the files globals.css declares. Run after changing
 * WORLD_GLYPHS: npx tsx scripts/fetch-world-glyph-fonts.mts
 */
import { writeFileSync } from 'node:fs'
import { WORLD_GLYPHS_FONT } from '../src/lib/world-glyphs'

// A modern user agent, or Google answers with TTF.
const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' }
const css = await (await fetch(WORLD_GLYPHS_FONT, { headers })).text()

for (const face of css.match(/@font-face\s*{[^}]+}/g) ?? []) {
  const family = /font-family:\s*'([^']+)'/.exec(face)![1]
  const url = /url\(([^)]+)\)/.exec(face)![1]
  const file = `${family.toLowerCase().replace('noto sans ', '').replace(/ /g, '-')}.woff2`
  writeFileSync(`src/assets/fonts/world/${file}`, Buffer.from(await (await fetch(url)).arrayBuffer()))
  console.log(family, '→', file)
}
