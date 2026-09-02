import type { SVGProps } from 'react'

/**
 * Inline icon set — no icon dependency. Stroke icons share a chunky 2px cap so
 * they sit next to the sticker outlines without looking thin.
 *
 * Every icon is passed through a displacement filter so the lines waver slightly
 * instead of being perfectly true, which is what makes a drawing read as drawn.
 * Redrawing forty paths by hand would have been the alternative; one filter does
 * it uniformly and stays legible at 14px. Technology marks are deliberately left
 * out of this — a wobbly brand logo reads as broken, not hand-made.
 */
type IconProps = SVGProps<SVGSVGElement>

const WOBBLE = 'url(#ink-wobble)'

/**
 * The filter itself, mounted once per document. When it is absent the reference
 * is simply ignored and the icons render as clean geometry, so nothing breaks.
 */
export function InkWobbleDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <filter id="ink-wobble" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.085" numOctaves="3" seed="9" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      filter={WOBBLE}
      {...props}
    >
      {children}
    </svg>
  )
}

function Solid({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" filter={WOBBLE} {...props}>
      {children}
    </svg>
  )
}

/* ------------------------------- brand -------------------------------- */

export const GitHubIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.35-1.3-1.71-1.3-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
  </Solid>
)

export const FacebookIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </Solid>
)

export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
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
    <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <path d="m3.5 7 7.6 5.3a1.6 1.6 0 0 0 1.8 0L20.5 7" />
  </Stroke>
)

export const PhoneIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6.2 3h2.9l1.6 4-2 1.4a12 12 0 0 0 5.9 5.9l1.4-2 4 1.6v2.9a2 2 0 0 1-2.2 2A16.9 16.9 0 0 1 4.2 5.2 2 2 0 0 1 6.2 3Z" />
  </Stroke>
)

export const MapPinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Stroke>
)

/* -------------------------------- ui ---------------------------------- */

export const SunIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
  </Stroke>
)

export const MoonIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.5 8.5 0 1 0 9.4 9.4Z" />
  </Stroke>
)

export const MonitorIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2.5" />
    <path d="M8.5 21h7M12 17v4" />
  </Stroke>
)

export const GlobeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M2.8 12h18.4M12 2.8c2.4 2.5 3.6 5.7 3.6 9.2S14.4 18.7 12 21.2c-2.4-2.5-3.6-5.7-3.6-9.2S9.6 5.3 12 2.8Z" />
  </Stroke>
)

export const MenuIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Stroke>
)

export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
  </Stroke>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Stroke>
)

export const ArrowUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 20V5M6 11l6-6 6 6" />
  </Stroke>
)

export const DownloadIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 17.5v1.2A2.3 2.3 0 0 0 6.3 21h11.4a2.3 2.3 0 0 0 2.3-2.3v-1.2" />
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
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
    <path d="M15.5 5.5v-.7a2.3 2.3 0 0 0-2.3-2.3H5.8a2.3 2.3 0 0 0-2.3 2.3v7.4a2.3 2.3 0 0 0 2.3 2.3h.7" />
  </Stroke>
)

export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Stroke>
)

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 6.8V12l3.4 2.2" />
  </Stroke>
)

export const CalendarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Stroke>
)

export const BriefcaseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="2.5" y="7" width="19" height="13" rx="3" />
    <path d="M8.5 7V5.5A2 2 0 0 1 10.5 3.5h3a2 2 0 0 1 2 2V7M2.5 12.5h19" />
  </Stroke>
)

export const CapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3.5 22 8.5l-10 5-10-5 10-5Z" />
    <path d="M6.5 11v5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-5M20.5 10v5.5" />
  </Stroke>
)

export const CodeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5M13.5 4l-3 16" />
  </Stroke>
)

export const ListIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M3.6 6.5h.01M3.6 12h.01M3.6 17.5h.01" />
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
    <path d="M12 5v14M5 12h14" />
  </Stroke>
)

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h16M9.5 7V5.2A1.7 1.7 0 0 1 11.2 3.5h1.6A1.7 1.7 0 0 1 14.5 5.2V7M6.5 7l.8 12.1A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.9L17.5 7" />
  </Stroke>
)

export const EyeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.2" />
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
    <circle cx="3.5" cy="7" r="1.3" />
    <circle cx="20.5" cy="7" r="1.3" />
    <circle cx="12" cy="4" r="1.3" />
  </Stroke>
)

export const ThumbsUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7 10.5 11 3a2.2 2.2 0 0 1 2.2 2.2V9h4.6a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7" />
    <rect x="3" y="10" width="4" height="9.5" rx="1.4" />
  </Stroke>
)

export const RssIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4.5 11.5a8 8 0 0 1 8 8M4.5 5.5a14 14 0 0 1 14 14" />
    <circle cx="5.2" cy="18.8" r="1.7" fill="currentColor" stroke="none" />
  </Stroke>
)

export const SitemapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="2.8" width="6" height="5" rx="1.6" />
    <rect x="2.5" y="16.2" width="6" height="5" rx="1.6" />
    <rect x="15.5" y="16.2" width="6" height="5" rx="1.6" />
    <path d="M12 7.8v3.4M5.5 16.2v-2.2a1.2 1.2 0 0 1 1.2-1.2h10.6a1.2 1.2 0 0 1 1.2 1.2v2.2" />
  </Stroke>
)

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="10.8" cy="10.8" r="7" />
    <path d="m16 16 4.5 4.5" />
  </Stroke>
)

export const TagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3.5 11.3V4.8a1.3 1.3 0 0 1 1.3-1.3h6.5a1.3 1.3 0 0 1 .9.4l8 8a1.3 1.3 0 0 1 0 1.8l-6.5 6.5a1.3 1.3 0 0 1-1.8 0l-8-8a1.3 1.3 0 0 1-.4-.9Z" />
    <circle cx="8" cy="8" r="1.6" />
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
