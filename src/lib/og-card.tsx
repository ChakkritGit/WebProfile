import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { WEBRING_DOMAIN } from '@/config/site'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const INK = '#0A0A23'
const PAPER = '#F8F9FA'
const BLUE = '#0000FF'
const LINE = '#D6D7E4'

// Inlined so the card never depends on a network fetch at render time.
const markSrc = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), 'src/app/icon.svg'), 'base64')}`

// next/og ships a single bundled font, so hierarchy comes from size and colour.
// It sets only the Latin labels now; the title and subtitle are drawn by `textImage`.
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const DOT = 48
const COLS = Math.ceil(OG_SIZE.width / DOT)
const ROWS = Math.ceil(OG_SIZE.height / DOT)

function DotGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} style={{ display: 'flex', height: DOT, alignItems: 'center' }}>
          {Array.from({ length: COLS }, (_, col) => (
            <div key={col} style={{ width: DOT, height: DOT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: 'rgba(0, 0, 255, 0.14)' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Text drawn by sharp (libvips → Pango → HarfBuzz) rather than by satori.
 *
 * Satori cannot set Thai. Measured with eight Thai faces, the same two faults
 * in all of them: a tone mark after a vowel is dropped (ที่ → ที, ปุ่น → ปุน)
 * and ์ lands on top of ิ instead of above it, so the owner's own surname
 * (เหล่าฤทธิ์) came out with its last syllable piled into one glyph. HarfBuzz
 * does the mark stacking a browser does, so the lines are drawn there and
 * placed on the card as images. One font file, Thai and Latin both.
 */
const FONT_FILE = join(process.cwd(), 'src/assets/fonts/NotoSansThai-Medium.ttf')

const escapeMarkup = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function textImage(text: string, size: number, color: string, width: number) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
      font: `Noto Sans Thai ${size}`,
      fontfile: FONT_FILE,
      width,
      dpi: 72,
      rgba: true,
      // Points between lines. Thai marks above and below need the room.
      spacing: Math.round(size * 0.18),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })
  return { src: `data:image/png;base64,${data.toString('base64')}`, width: info.width, height: info.height }
}

/** Long titles need to step down or they overflow the card. */
function titleSize(title: string) {
  const n = title.length
  if (n <= 26) return 92
  if (n <= 44) return 72
  if (n <= 70) return 58
  return 46
}

export interface OgCardOptions {
  /** Small uppercase label above the title. */
  eyebrow: string
  title: string
  /** Blue line under the title — role, summary or stack. */
  subtitle?: string
  /** Small grey text bottom-left. Defaults to the site domain. */
  footer?: string
}

export async function renderOgCard({ eyebrow, title, subtitle, footer }: OgCardOptions) {
  const thaiEyebrow = /[\u0E00-\u0E7F]/.test(eyebrow)
  const [titleImg, subtitleImg, eyebrowImg] = await Promise.all([
    textImage(title, titleSize(title), INK, 900),
    subtitle ? textImage(subtitle, 33, BLUE, 900) : null,
    thaiEyebrow ? textImage(eyebrow, 26, BLUE, 700) : null,
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: PAPER,
          fontFamily: FONT_STACK,
        }}
      >
        <DotGrid />

        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 68,
            border: `2px solid ${LINE}`,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >

          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {/* next/og renders through satori, which only understands plain
                <img>; next/image has no meaning inside an ImageResponse. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={88} height={88} alt="" />
            {eyebrowImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={eyebrowImg.src} width={eyebrowImg.width} height={eyebrowImg.height} alt="" />
            ) : (
              <div style={{ display: 'flex', fontSize: 26, letterSpacing: '0.22em', textTransform: 'uppercase', color: BLUE, fontFamily: 'monospace' }}>
                {eyebrow}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900, paddingBottom: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={titleImg.src} width={titleImg.width} height={titleImg.height} alt="" />
            <div style={{ display: 'flex', width: 132, height: 6, backgroundColor: BLUE, marginTop: 22 }} />
            {subtitleImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={subtitleImg.src} width={subtitleImg.width} height={subtitleImg.height} alt="" style={{ marginTop: 20 }} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: 25, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10, 10, 35, 0.55)' }}>
              {footer ?? WEBRING_DOMAIN}
            </div>
            <div style={{ width: 18, height: 18, backgroundColor: BLUE, display: 'flex' }} />
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}

/** Trims to a word boundary so the card never shows a cut-off word. */
export function clampText(input: string, max: number) {
  const text = input.trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}
