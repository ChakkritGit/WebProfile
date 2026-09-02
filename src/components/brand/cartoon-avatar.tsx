import { cn } from '@/lib/utils'

/**
 * Chibi-style portrait, hand-authored as SVG.
 *
 * Vector approximation of a cel-shaded illustration: big head-to-body ratio,
 * messy layered hair with highlight sparkles, oversized eyes and blush. Kept as
 * SVG so it stays crisp at any size and picks up the theme tokens — swap in a
 * raster illustration via `profile.avatar` if a painted version is ever made.
 */

const HAIR = '#241E28'
const HAIR_HI = '#4A4152'
const SKIN = '#F6DCC4'
const SKIN_SHADE = '#EBC9AC'
const BLUSH = '#F4A6A6'
const SHIRT = '#FFFFFF'

export function CartoonAvatar({ className, title }: { className?: string; title: string }) {
  const INK = '#1C1722'
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={title} className={cn('size-full', className)}>
      <defs>
        <clipPath id="ca-frame">
          <rect width="400" height="400" rx="28" />
        </clipPath>
        <linearGradient id="ca-sky" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="var(--sky-soft)" />
          <stop offset="100%" stopColor="var(--violet-soft)" />
        </linearGradient>
      </defs>

      <g clipPath="url(#ca-frame)">
        <rect width="400" height="400" fill="url(#ca-sky)" />
        {/* soft clouds */}
        <g fill="var(--paper)" opacity="0.55">
          <circle cx="52" cy="352" r="46" />
          <circle cx="110" cy="374" r="38" />
          <circle cx="348" cy="330" r="42" />
          <circle cx="300" cy="366" r="32" />
        </g>

        <g stroke={INK} strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round">
          {/* ---------------- body: small, chibi proportions ---------------- */}
          <path
            d="M158 300c0-20 19-32 42-32s42 12 42 32l30 14v86H128v-86l30-14Z"
            fill={SHIRT}
          />
          {/* sleeves */}
          <path d="M158 300c-22 6-34 20-38 40l34 12 10-40Z" fill={SHIRT} />
          <path d="M242 300c22 6 34 20 38 40l-34 12-10-40Z" fill={SHIRT} />
          {/* little hands */}
          <ellipse cx="112" cy="348" rx="16" ry="13" fill={SKIN} transform="rotate(-18 112 348)" />
          <ellipse cx="288" cy="348" rx="16" ry="13" fill={SKIN} transform="rotate(18 288 348)" />

          {/* neck */}
          <path d="M184 258h32v26h-32z" fill={SKIN_SHADE} />

          {/* ---------------- head ---------------- */}
          <ellipse cx="200" cy="176" rx="96" ry="90" fill={SKIN} />

          {/* hair: back mass */}
          <path
            d="M200 62c62 0 106 42 106 100 0 26-6 44-14 56 4-30-2-52-10-62-6 22-16 32-22 36 2-40-8-58-16-66-24 16-70 18-96 4-10 10-18 28-16 62-8-6-16-18-20-34-6 18-6 38-2 60-10-14-16-34-16-56C94 104 138 62 200 62Z"
            fill={HAIR}
          />
          {/* messy front spikes */}
          <path
            d="M118 150c8-34 34-58 62-64-16 14-24 30-26 44 14-20 34-32 54-34-14 12-22 26-24 40 16-16 36-24 54-22-30 12-44 34-46 56-16-16-46-22-74-20Z"
            fill={HAIR}
          />
          {/* side tufts */}
          <path d="M104 168c-10 24-8 48 2 66-14-14-22-34-20-56 1-6 3-9 6-12l12 2Z" fill={HAIR} />
          <path d="M296 168c10 24 8 48-2 66 14-14 22-34 20-56-1-6-3-9-6-12l-12 2Z" fill={HAIR} />

          {/* hair highlights + sparkles */}
          <g strokeWidth="0">
            <path d="M146 106c14-14 30-22 46-24-16 10-28 22-36 34l-10-10Z" fill={HAIR_HI} opacity="0.55" />
            <path d="M252 100c14 6 26 16 34 30-14-12-28-20-42-24l8-6Z" fill={HAIR_HI} opacity="0.55" />
            <g fill="var(--paper)">
              <path d="M158 96l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" />
              <path d="M262 118l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
              <path d="M236 92l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
            </g>
          </g>

          {/* blush */}
          <g strokeWidth="0" fill={BLUSH} opacity="0.75">
            <ellipse cx="142" cy="204" rx="21" ry="13" />
            <ellipse cx="258" cy="204" rx="21" ry="13" />
          </g>

          {/* eyes — big, glossy */}
          <g>
            <ellipse cx="164" cy="184" rx="16" ry="27" fill={INK} stroke="none" />
            <ellipse cx="236" cy="184" rx="16" ry="27" fill={INK} stroke="none" />
            <g fill="var(--paper)" stroke="none">
              <ellipse cx="159" cy="172" rx="6" ry="8" />
              <ellipse cx="231" cy="172" rx="6" ry="8" />
              <circle cx="169" cy="196" r="3.2" opacity="0.8" />
              <circle cx="241" cy="196" r="3.2" opacity="0.8" />
            </g>
          </g>

          {/* round glasses */}
          <g fill="var(--paper)" fillOpacity="0.1" strokeWidth="5">
            <circle cx="164" cy="184" r="34" />
            <circle cx="236" cy="184" r="34" />
            <path d="M198 182h4" strokeWidth="4.5" />
            <path d="M130 176l-16-5M270 176l16-5" strokeWidth="4.5" fill="none" />
          </g>
          {/* lens glint */}
          <g stroke="none" fill="var(--paper)" opacity="0.5">
            <path d="M146 166c6-8 14-12 22-12-9 4-16 10-19 18l-3-6Z" />
            <path d="M218 166c6-8 14-12 22-12-9 4-16 10-19 18l-3-6Z" />
          </g>

          {/* open smile */}
          <path d="M186 214c4 12 24 12 28 0Z" fill="#B4525C" />
          <path d="M186 214c4 12 24 12 28 0" fill="none" strokeWidth="4.5" />
          <path d="M194 222c3 5 9 5 12 0" fill="#E58A94" stroke="none" />
        </g>
      </g>

      <rect x="3" y="3" width="394" height="394" rx="26" fill="none" stroke="var(--line)" strokeWidth="6" />
    </svg>
  )
}
