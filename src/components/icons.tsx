import type { SVGProps } from 'react'

/**
 * Inline icon set — no icon dependency. Stroke icons share a chunky 2px cap so
 * they sit next to the sticker outlines without looking thin.
 *
 * The hand-drawn quality comes from the geometry, not from a filter. A displacement
 * filter was tried first and it only made the lines fuzzy — blurring a perfect
 * circle does not produce a drawn one. So the two shapes a pen is worst at, circles
 * and boxes, are built here as paths that are out of round, uneven at the corners,
 * and close slightly past where they started.
 */
type IconProps = SVGProps<SVGSVGElement>

/** A circle the way a pen draws one: out of round, and closing past its own start. */
function handCircle(cx: number, cy: number, r: number): string {
  const K = 0.5523 // circle-to-cubic constant
  const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
  const SQUASH = [1.03, 0.96, 1.04, 0.97] // no two quadrants share a radius
  const n = (v: number) => Math.round(v * 100) / 100
  const at = (i: number) => {
    const a = ANGLES[i % 4]
    const m = SQUASH[i % 4] * r
    return { x: cx + Math.cos(a) * m, y: cy + Math.sin(a) * m, a, m }
  }

  let d = ''
  for (let i = 0; i < 4; i++) {
    const from = at(i)
    const to = at(i + 1)
    const c1 = { x: from.x - Math.sin(from.a) * from.m * K, y: from.y + Math.cos(from.a) * from.m * K }
    const c2 = { x: to.x + Math.sin(to.a) * to.m * K, y: to.y - Math.cos(to.a) * to.m * K }
    if (i === 0) d += `M${n(from.x)} ${n(from.y)}`
    d += `C${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(to.x)} ${n(to.y)}`
  }
  // Carry on a little past the join so the seam shows, the way a real loop does.
  const end = { x: cx + Math.cos(-Math.PI / 2 + 0.5) * r, y: cy + Math.sin(-Math.PI / 2 + 0.5) * r }
  d += `C${n(cx - r * 0.3)} ${n(cy - r * 1.04)} ${n(cx + r * 0.1)} ${n(cy - r * 1.06)} ${n(end.x)} ${n(end.y)}`
  return d
}

/** A box drawn freehand: every corner a different roundness, sides never quite true. */
function handRect(x: number, y: number, w: number, h: number, r: number): string {
  const n = (v: number) => Math.round(v * 100) / 100
  const [tl, tr, br, bl] = [r * 1.2, r * 0.8, r * 1.15, r * 0.88]
  const o = Math.min(1.6, Math.max(w, h) * 0.09) // how far each corner overshoots

  // Drawn as three strokes, not one closed loop: two long sides and a lid, each
  // carrying a little past where it should stop. A single closed path always
  // meets itself exactly, which is the thing a drawn box never does.
  return [
    // top edge, starting before the corner and running past the far one
    `M${n(x + tl - o)} ${n(y + 0.3)}`,
    `Q${n(x + w * 0.5)} ${n(y - 0.5)} ${n(x + w - tr + o * 0.6)} ${n(y)}`,
    // right side down, overshooting the bottom corner
    `M${n(x + w)} ${n(y + tr - o * 0.5)}`,
    `Q${n(x + w + 0.5)} ${n(y + h * 0.5)} ${n(x + w - 0.2)} ${n(y + h - br + o * 0.5)}`,
    // bottom edge back, and the left side up past the start
    `M${n(x + w - br + o * 0.4)} ${n(y + h)}`,
    `Q${n(x + w * 0.5)} ${n(y + h + 0.6)} ${n(x + bl - o * 0.5)} ${n(y + h - 0.2)}`,
    `M${n(x + 0.2)} ${n(y + h - bl + o * 0.4)}`,
    `Q${n(x - 0.5)} ${n(y + h * 0.5)} ${n(x)} ${n(y + tl - o)}`,
    // the four corners, each a short curve joining the strokes it sits between
    `M${n(x + tl - o)} ${n(y + 0.3)}Q${n(x)} ${n(y)} ${n(x)} ${n(y + tl - o)}`,
    `M${n(x + w - tr + o * 0.6)} ${n(y)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + tr - o * 0.5)}`,
    `M${n(x + w - 0.2)} ${n(y + h - br + o * 0.5)}Q${n(x + w)} ${n(y + h)} ${n(x + w - br + o * 0.4)} ${n(y + h)}`,
    `M${n(x + bl - o * 0.5)} ${n(y + h - 0.2)}Q${n(x)} ${n(y + h)} ${n(x + 0.2)} ${n(y + h - bl + o * 0.4)}`,
  ].join('')
}

type CircleProps = { cx: number; cy: number; r: number } & Omit<SVGProps<SVGPathElement>, 'd'>
const HandCircle = ({ cx, cy, r, ...rest }: CircleProps) => (
  <path d={handCircle(cx, cy, r)} {...rest} />
)

type RectProps = { x: number; y: number; width: number; height: number; rx: number } & Omit<
  SVGProps<SVGPathElement>,
  'd'
>
const HandRect = ({ x, y, width, height, rx, ...rest }: RectProps) => (
  <path d={handRect(x, y, width, height, rx)} {...rest} />
)

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

function Solid({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

/* ------------------------------- brand -------------------------------- */

export const GitHubIcon = (p: IconProps) => (
  <Stroke {...p} strokeWidth={1.9}>
    <HandCircle cx={12} cy={12} r={9.7} />
    <path
      fill="currentColor"
      stroke="none"
      d="M8.5 6.4c-.6-1-.6-2 0-3 1 .1 1.9.6 2.7 1.4a7.6 7.6 0 0 1 1.9 0c.8-.8 1.6-1.3 2.6-1.4.6 1 .6 2 .1 3 1 1 1.4 2.2 1.3 3.5-.1 2.8-1.8 4.2-4.4 4.7.5.4.7 1 .7 1.8v3c0 .4-.3.6-.7.5-.4 0-.6-.3-.6-.7v-2.7c0-.9-.3-1.4-.8-1.7-2.5-.5-4.2-1.9-4.3-4.7-.1-1.4.4-2.6 1.5-3.7Z"
    />
    <path d="M9.4 18.6q-2.2.5-3.1-1.5" />
  </Stroke>
)

export const FacebookIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </Solid>
)

export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={2.5} y={2.5} width={19} height={19} rx={5.5} />
    <HandCircle cx={12} cy={12} r={4} />
    <HandCircle cx={17.6} cy={6.4} r={1.1} fill="currentColor" stroke="none" />
  </Stroke>
)

export const TikTokIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M16.5 2h-3v13.2a2.9 2.9 0 1 1-2.4-2.85V9.3a6.1 6.1 0 1 0 5.4 6.05V8.9a7 7 0 0 0 4 1.27V7.13A4.1 4.1 0 0 1 16.5 2Z" />
  </Solid>
)

/* ------------------------------ contact ------------------------------- */

export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={2.5} y={4.5} width={19} height={15} rx={3} />
    <path d="m3.5 7 7.6 5.3a1.6 1.6 0 0 0 1.8 0L20.5 7" />
  </Stroke>
)

export const PhoneIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6.4 3.1q1.3-.2 2.6.1l1.5 3.8-1.9 1.5" />
    <path d="M8.7 8.6a12.2 12.2 0 0 0 6 5.8" />
    <path d="M14.5 14.2l1.4-1.9 3.9 1.5q.2 1.4 0 2.8a2 2 0 0 1-2.3 1.9" />
    <path d="M17.4 18.5A17 17 0 0 1 4.3 5.4 2 2 0 0 1 6.4 3.1" />
  </Stroke>
)

export const MapPinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <HandCircle cx={12} cy={10} r={2.6} />
  </Stroke>
)

/* -------------------------------- ui ---------------------------------- */

export const SunIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandCircle cx={12} cy={12} r={4.2} />
    <path d="M12.1 2.4v2.2M11.9 19.6v2M2.4 12.1h2.1M19.6 11.9h2.2M5.1 5.3l1.6 1.4M17.4 17.2l1.4 1.7M18.9 5.1l-1.6 1.6M6.8 17.4l-1.7 1.4" />
  </Stroke>
)

export const MoonIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.5 8.5 0 1 0 9.4 9.4Z" />
  </Stroke>
)

export const MonitorIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={2.5} y={4} width={19} height={13} rx={2.5} />
    <path d="M8.4 21.1q3.5-.3 7.1-.1M12.1 17q-.2 2 0 4" />
  </Stroke>
)

export const GlobeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandCircle cx={12} cy={12} r={9.2} />
    <path d="M2.9 12.1q9.2-.4 18.3-.2M12 2.8c2.5 2.6 3.7 5.7 3.6 9.3-.1 3.4-1.3 6.5-3.7 9.1-2.3-2.6-3.5-5.7-3.5-9.2 0-3.4 1.2-6.5 3.6-9.2Z" />
  </Stroke>
)

export const MenuIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.6 6.7q8.5-.5 16.8.2M3.4 12.2q5.2-.4 8.2-.3M13.6 11.9q3.6 0 6.9.3M4 17.1q8-.6 16.2.1" />
  </Stroke>
)

export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5.4 5.7q6.8 6.3 13.3 12.9M18.7 5.4q-6.5 6.8-13.2 13" />
  </Stroke>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.9 12.1q7.6-.5 15-.2M12.8 5.8q3.1 3 6.1 6.1M19.1 12q-2.8 3.2-6 6.2" />
  </Stroke>
)

export const ArrowUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12.1 20.1q-.4-7.4-.2-15M5.9 11.2q3-3.2 6.1-6.2M12.1 5q3.2 2.9 6.1 6.1" />
  </Stroke>
)

export const DownloadIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12.1 3.4q-.3 5.6-.1 11.1M7.4 10.6 12 15.1l4.6-4.6M4.1 17.4v1.3A2.3 2.3 0 0 0 6.4 21h11.3a2.3 2.3 0 0 0 2.3-2.3v-1.3" />
  </Stroke>
)

export const ExternalLinkIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14.5v3.7A2.8 2.8 0 0 1 15.2 21H5.8A2.8 2.8 0 0 1 3 18.2V8.8A2.8 2.8 0 0 1 5.8 6h3.7" />
  </Stroke>
)

export const SparkleIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 2.5c.5 4.4 2.6 6.5 7 7-4.4.5-6.5 2.6-7 7-.5-4.4-2.6-6.5-7-7 4.4-.5 6.5-2.6 7-7ZM19.5 14c.25 2 1.2 2.95 3.2 3.2-2 .25-2.95 1.2-3.2 3.2-.25-2-1.2-2.95-3.2-3.2 2-.25 2.95-1.2 3.2-3.2Z" />
  </Solid>
)

export const CopyIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={8.5} y={8.5} width={12} height={12} rx={2.5} />
    <path d="M15.5 5.5v-.7a2.3 2.3 0 0 0-2.3-2.3H5.8a2.3 2.3 0 0 0-2.3 2.3v7.4a2.3 2.3 0 0 0 2.3 2.3h.7" />
  </Stroke>
)

export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.4 12.4q2.6 2.7 5.2 5.2M9.4 17.5q4.7-5.4 9.9-10.8" />
  </Stroke>
)

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandCircle cx={12} cy={12} r={9.2} />
    <path d="M12.1 6.7q-.2 2.7-.1 5.4 1.8 1 3.4 2.2" />
  </Stroke>
)

export const CalendarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={3} y={5} width={18} height={16} rx={3} />
    <path d="M3.1 10.1q8.9-.4 17.8-.2M8.1 2.9q-.2 2-.1 4.1M15.9 3.1q.2 2 .1 4" />
  </Stroke>
)

export const BriefcaseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={2.5} y={7} width={19} height={13} rx={3} />
    <path d="M8.6 7V5.5A2 2 0 0 1 10.6 3.5h2.9a2 2 0 0 1 2 2.1V7M2.6 12.6q9.4-.4 18.7-.2" />
  </Stroke>
)

export const CapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3.5 22 8.5l-10 5-10-5 10-5Z" />
    <path d="M6.5 11.1v4.9c0 1.5 2.6 2.8 5.6 2.8s5.4-1.4 5.4-2.9v-4.9M20.6 9.9q-.2 2.8 0 5.6" />
  </Stroke>
)

export const CodeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8.6 7.3 3.5 12l5.2 4.6M15.4 7.6l5.1 4.5-5.2 4.5M13.6 3.9q-1.7 8.1-3.2 16.1" />
  </Stroke>
)

export const ListIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8.6 6.3q6.1-.4 11.7.2M8.4 12.1q5.9-.4 11.4-.1M8.7 17.6q5.7-.5 11.1.1M3.5 6.4h.01M3.7 12.1h.01M3.5 17.4h.01" />
  </Stroke>
)

export const TextSizeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.4 15.4 6.6 8.2 9.9 15.4M4.4 13.1q2.2-.3 4.3.1" />
    <path d="M12.6 19.4 17 5.3l4.6 14.1M14 15.5q3-.4 6 .1" />
  </Stroke>
)

export const PencilIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20.2h4l10.6-10.6a2.8 2.8 0 0 0-4-4L4 16.2v4Z" />
    <path d="m14.5 5.5 4 4" />
  </Stroke>
)

export const PlusIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12.1 4.9q-.3 7-.1 14.2M4.9 12.1q6.9-.4 14.2-.1" />
  </Stroke>
)

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.1 7.1q7.9-.4 15.8-.2M9.6 7V5.2A1.7 1.7 0 0 1 11.3 3.5h1.5a1.7 1.7 0 0 1 1.7 1.8V7M6.6 7.1l.8 12A2 2 0 0 0 9.4 21h5.3a2 2 0 0 0 2-1.9l.7-12" />
  </Stroke>
)

export const EyeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <HandCircle cx={12} cy={12} r={3.2} />
  </Stroke>
)

export const LayersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5" />
  </Stroke>
)

/* ------------------------- hand-drawn line art ------------------------- *
 * Replaces emoji so the cartoon accents render identically on every OS and
 * inherit the theme's ink colour instead of a vendor's colour palette.
 * ---------------------------------------------------------------------- */

export const CrownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 8.5 6.8 13 12 5.5 17.2 13l3.3-4.5v8.2a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8V8.5Z" />
    <path d="M3.5 15.5h17" />
    <HandCircle cx={3.5} cy={7} r={1.3} />
    <HandCircle cx={20.5} cy={7} r={1.3} />
    <HandCircle cx={12} cy={4} r={1.3} />
  </Stroke>
)

export const ThumbsUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7 10.5 11 3a2.2 2.2 0 0 1 2.2 2.2V9h4.6a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7" />
    <HandRect x={3} y={10} width={4} height={9.5} rx={1.4} />
  </Stroke>
)

export const RssIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.5 11.5a8 8 0 0 1 8 8M4.5 5.5a14 14 0 0 1 14 14" />
    <HandCircle cx={5.2} cy={18.8} r={1.7} fill="currentColor" stroke="none" />
  </Stroke>
)

export const SitemapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandRect x={9} y={2.8} width={6} height={5} rx={1.6} />
    <HandRect x={2.5} y={16.2} width={6} height={5} rx={1.6} />
    <HandRect x={15.5} y={16.2} width={6} height={5} rx={1.6} />
    <path d="M12 7.8v3.4M5.5 16.2v-2.2a1.2 1.2 0 0 1 1.2-1.2h10.6a1.2 1.2 0 0 1 1.2 1.2v2.2" />
  </Stroke>
)

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <HandCircle cx={10.8} cy={10.8} r={7} />
    <path d="m16 16 4.5 4.5" />
  </Stroke>
)

export const TagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 11.3V4.8a1.3 1.3 0 0 1 1.3-1.3h6.5a1.3 1.3 0 0 1 .9.4l8 8a1.3 1.3 0 0 1 0 1.8l-6.5 6.5a1.3 1.3 0 0 1-1.8 0l-8-8a1.3 1.3 0 0 1-.4-.9Z" />
    <HandCircle cx={8} cy={8} r={1.6} />
  </Stroke>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Stroke>
)

/** Three hand-drawn ticks used as a section delimiter. */
export const DelimiterMark = (p: IconProps) => (
  <svg viewBox="0 0 84 16" fill="none" aria-hidden="true" {...p}>
    <path
      d="M8 8h14M62 8h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    <path
      d="M42 2.5c.5 3 1.9 4.4 4.9 4.9-3 .5-4.4 1.9-4.9 4.9-.5-3-1.9-4.4-4.9-4.9 3-.5 4.4-1.9 4.9-4.9ZM31 5c.3 1.9 1.2 2.8 3.1 3.1-1.9.3-2.8 1.2-3.1 3.1-.3-1.9-1.2-2.8-3.1-3.1 1.9-.3 2.8-1.2 3.1-3.1ZM53 5c.3 1.9 1.2 2.8 3.1 3.1-1.9.3-2.8 1.2-3.1 3.1-.3-1.9-1.2-2.8-3.1-3.1 1.9-.3 2.8-1.2 3.1-3.1Z"
      fill="currentColor"
    />
  </svg>
)
