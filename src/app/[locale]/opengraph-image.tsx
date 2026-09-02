import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

import { WEBRING_DOMAIN, profile } from '@/config/site'

export const alt = `${profile.name} — ${profile.role}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#241F2E'
const CREAM = '#FFFCF7'
const CORAL = '#FF5A5F'
const MINT = '#23C4B4'

// Same mark as the favicon, inlined so the card never depends on a network fetch.
const markSvg = readFileSync(join(process.cwd(), 'src/app/icon.svg'), 'base64')
const markSrc = `data:image/svg+xml;base64,${markSvg}`

// `next/og` ships a single bundled font, so hierarchy comes from size and
// colour rather than weight. Named here only to keep intent explicit.
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const DOT_SPACING = 48
const DOT_COLUMNS = Math.ceil(size.width / DOT_SPACING)
const DOT_ROWS = Math.ceil(size.height / DOT_SPACING)

function DotGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: DOT_ROWS }, (_, row) => (
        <div key={row} style={{ display: 'flex', height: DOT_SPACING, alignItems: 'center' }}>
          {Array.from({ length: DOT_COLUMNS }, (_, column) => (
            <div
              key={column}
              style={{
                width: DOT_SPACING,
                height: DOT_SPACING,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: 'rgba(36, 31, 46, 0.12)',
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Image() {
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

        {/* Sticker frame: thick ink outline inset from the canvas edge. */}
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
          <div
            style={{
              position: 'absolute',
              top: -150,
              right: -110,
              width: 380,
              height: 380,
              borderRadius: 380,
              backgroundColor: 'rgba(255, 90, 95, 0.16)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -78,
              right: -64,
              width: 250,
              height: 250,
              borderRadius: 76,
              backgroundColor: 'rgba(35, 196, 180, 0.20)',
              transform: 'rotate(18deg)',
              display: 'flex',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <img src={markSrc} width={88} height={88} alt="" />
            <div
              style={{
                display: 'flex',
                fontSize: 26,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(36, 31, 46, 0.6)',
              }}
            >
              Portfolio
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 92,
                lineHeight: 1.05,
                letterSpacing: '-0.045em',
                color: INK,
              }}
            >
              {profile.name}
            </div>
            <div style={{ display: 'flex', width: 132, height: 10, borderRadius: 10, backgroundColor: CORAL, marginTop: 22 }} />
            <div style={{ display: 'flex', fontSize: 42, letterSpacing: '-0.01em', color: CORAL, marginTop: 22 }}>
              {profile.role}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 25,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(36, 31, 46, 0.55)',
              }}
            >
              {WEBRING_DOMAIN}
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
    size,
  )
}
