import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { WEBRING_DOMAIN } from '@/config/site'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const INK = '#241F2E'
const CREAM = '#FFFCF7'
const CORAL = '#FF5A5F'
const MINT = '#23C4B4'

// Inlined so the card never depends on a network fetch at render time.
const markSrc = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), 'src/app/icon.svg'), 'base64')}`

// next/og ships a single bundled font, so hierarchy comes from size and colour.
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
              <div style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: 'rgba(36, 31, 46, 0.12)' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
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
  /** Coral line under the title — role, summary or stack. */
  subtitle?: string
  /** Small grey text bottom-left. Defaults to the site domain. */
  footer?: string
}

export function renderOgCard({ eyebrow, title, subtitle, footer }: OgCardOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: CREAM,
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
            border: `9px solid ${INK}`,
            borderRadius: 52,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -150, right: -110, width: 380, height: 380, borderRadius: 380, backgroundColor: 'rgba(255, 90, 95, 0.16)', display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: -78, right: -64, width: 250, height: 250, borderRadius: 76, backgroundColor: 'rgba(35, 196, 180, 0.20)', transform: 'rotate(18deg)', display: 'flex' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {/* next/og renders through satori, which only understands plain
                <img>; next/image has no meaning inside an ImageResponse. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={88} height={88} alt="" />
            <div style={{ display: 'flex', fontSize: 26, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(36, 31, 46, 0.6)' }}>
              {eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900, paddingBottom: 18 }}>
            <div style={{ display: 'flex', fontSize: titleSize(title), lineHeight: 1.08, letterSpacing: '-0.04em', color: INK }}>
              {title}
            </div>
            <div style={{ display: 'flex', width: 132, height: 10, borderRadius: 10, backgroundColor: CORAL, marginTop: 22 }} />
            {subtitle && (
              <div style={{ display: 'flex', fontSize: 33, lineHeight: 1.35, letterSpacing: '-0.01em', color: CORAL, marginTop: 20 }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: 25, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(36, 31, 46, 0.55)' }}>
              {footer ?? WEBRING_DOMAIN}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: CORAL, display: 'flex' }} />
              <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: MINT, display: 'flex' }} />
              <div style={{ width: 18, height: 18, borderRadius: 18, backgroundColor: INK, display: 'flex' }} />
            </div>
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
