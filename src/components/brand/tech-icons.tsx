import type { SVGProps } from 'react'

/**
 * Hand-drawn technology marks.
 *
 * Simplified geometric interpretations rather than the official artwork: they
 * stay legible at 14px, weigh nothing, and need no licensing or network fetch.
 * Brand colours are kept where they carry the recognition; anything that is
 * black-or-white officially uses `currentColor` so it inverts with the theme.
 */

type P = SVGProps<SVGSVGElement>

const Svg = ({ children, ...p }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    {children}
  </svg>
)

/* ------------------------------ languages ------------------------------ */

const JavaScript = (p: P) => (
  <Svg {...p}>
    <rect width="24" height="24" rx="4" fill="#F7DF1E" />
    <path
      d="M12.9 18.1c.5.8 1.1 1.4 2.2 1.4.9 0 1.5-.5 1.5-1.1 0-.8-.6-1-1.6-1.5l-.6-.2c-1.6-.7-2.7-1.5-2.7-3.3 0-1.6 1.2-2.9 3.2-2.9 1.4 0 2.4.5 3.1 1.8l-1.7 1.1c-.4-.7-.8-.9-1.4-.9s-1 .4-1 .9c0 .7.4.9 1.3 1.3l.6.3c1.9.8 3 1.6 3 3.5 0 2-1.5 3-3.6 3-2 0-3.3-1-4-2.2l1.7-1.2ZM6.4 18.3c.3.6.6 1.1 1.3 1.1.7 0 1.1-.3 1.1-1.3v-7.4h2.2v7.4c0 2.2-1.3 3.2-3.2 3.2-1.7 0-2.7-.9-3.2-2l1.8-1Z"
      fill="#1B1B1B"
    />
  </Svg>
)

const TypeScript = (p: P) => (
  <Svg {...p}>
    <rect width="24" height="24" rx="4" fill="#3178C6" />
    <path
      d="M13.4 19.3v-2.2c.4.4 1.3.8 2.2.8.9 0 1.4-.3 1.4-.9 0-.5-.4-.8-1.4-1.2-1.6-.6-2.4-1.4-2.4-2.8 0-1.7 1.3-2.7 3.2-2.7.9 0 1.7.2 2.2.4v2.1c-.5-.3-1.2-.6-2-.6-.8 0-1.2.3-1.2.8s.4.7 1.4 1.1c1.6.6 2.5 1.3 2.5 2.9 0 1.8-1.4 2.8-3.4 2.8-1 0-1.9-.2-2.5-.5ZM5 12.3h7v-2H5v2Zm2.4 0h2.2v8.4H7.4v-8.4Z"
      fill="#fff"
    />
  </Svg>
)

const Kotlin = (p: P) => (
  <Svg {...p}>
    <defs>
      <linearGradient id="tk-kt" x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#E44857" />
        <stop offset="50%" stopColor="#C711E1" />
        <stop offset="100%" stopColor="#7F52FF" />
      </linearGradient>
    </defs>
    <path d="M2 2h20L12 12l10 10H2V2Z" fill="url(#tk-kt)" />
  </Svg>
)

const Dart = (p: P) => (
  <Svg {...p}>
    <path d="M6.6 6.6 2 11.2v7.2l4.6 4.6h7.2L18.4 18 6.6 6.6Z" fill="#55BEFB" />
    <path d="M6.6 6.6 12.4 1l9.6 9.6v11.4h-8.2L6.6 6.6Z" fill="#01579B" />
  </Svg>
)

const SqlDb = ({ fill = '#4B8BBE', ...p }: P & { fill?: string }) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3.2" fill={fill} />
    <path d="M4 5.5v13c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-13c0 1.8-3.6 3.2-8 3.2s-8-1.4-8-3.2Z" fill={fill} opacity="0.75" />
    <path d="M4 11.8c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2M4 17c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" stroke="#fff" strokeWidth="1.1" fill="none" opacity="0.65" />
  </Svg>
)

/* ------------------------------- frontend ------------------------------ */

const React_ = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.1" fill="#61DAFB" />
    <g stroke="#61DAFB" strokeWidth="1.1" fill="none">
      <ellipse cx="12" cy="12" rx="10" ry="3.9" />
      <ellipse cx="12" cy="12" rx="10" ry="3.9" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="3.9" transform="rotate(120 12 12)" />
    </g>
  </Svg>
)

const NextJs = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path d="M8.2 7.6h1.7l6.6 9.1V7.6h1.4v9.9h-1.6L8.2 9.6v7.9H6.8V7.6h1.4Z" fill="var(--paper)" />
    <path d="M15.6 7.6h1.4v6.1l-1.4-1.9V7.6Z" fill="var(--paper)" />
  </Svg>
)

const Tailwind = (p: P) => (
  <Svg {...p}>
    <path
      d="M12 7.2c-2.7 0-4.4 1.3-5.1 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.8 1.9 1.4.98 1 2.1 2.2 4.6 2.2 2.7 0 4.4-1.3 5.1-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.8-1.9-1.4C15.7 8.4 14.6 7.2 12 7.2ZM6.9 13.2c-2.7 0-4.4 1.3-5.1 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.8 1.9 1.4 1 1 2.1 2.2 4.6 2.2 2.7 0 4.4-1.3 5.1-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.8-1.9-1.4-1-1-2.1-2.2-4.6-2.2Z"
      fill="#38BDF8"
    />
  </Svg>
)

const Shadcn = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16.5 7.5 7.5 16.5M15 15.5l1.5 1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </Svg>
)

const Bootstrap = (p: P) => (
  <Svg {...p}>
    <rect width="24" height="24" rx="5" fill="#7952B3" />
    <path
      d="M8 6.4h4.6c2.1 0 3.3 1 3.3 2.6 0 1.2-.8 2.1-1.9 2.3v.1c1.5.2 2.4 1.1 2.4 2.5 0 1.9-1.4 3-3.8 3H8V6.4Zm2.2 1.8v3h1.7c1.2 0 1.8-.5 1.8-1.5s-.6-1.5-1.7-1.5h-1.8Zm0 4.6v3.3h2c1.3 0 2-.6 2-1.7s-.7-1.6-2.1-1.6h-1.9Z"
      fill="#fff"
    />
  </Svg>
)

/* -------------------------------- backend ------------------------------ */

const NodeJs = (p: P) => (
  <Svg {...p}>
    <path d="M12 1.2 22 7v10l-10 5.8L2 17V7l10-5.8Z" fill="#539E43" />
    <path d="M12 6.4c2.6 0 4.2.9 4.2 2.5 0 .5-.4.9-.9.9s-.9-.4-.9-.8c0-.6-.8-1-2.4-1-1.7 0-2.3.4-2.3 1.1 0 .6.3.8 2.6 1.1 2.7.4 4 1 4 2.7 0 1.8-1.6 2.8-4.4 2.8-3.1 0-4.5-1-4.5-2.8 0-.5.4-.9.9-.9s.9.4.9.9c0 .8.9 1.2 2.7 1.2 1.9 0 2.6-.4 2.6-1.1 0-.6-.3-.8-2.7-1.1-2.6-.3-3.9-1-3.9-2.7 0-1.7 1.5-2.7 4.1-2.7Z" fill="#fff" />
  </Svg>
)

const Express = (p: P) => (
  <Svg {...p}>
    <path
      d="M2.2 11.4c.5-3.5 3-5.9 6-5.9 3.3 0 5.6 2.4 5.7 6.1 0 .4-.3.7-.7.7H4.1c.1 2.9 1.8 4.7 4.3 4.7 1.7 0 2.9-.7 3.7-2.1l1.4.7c-1 1.9-2.8 3-5.1 3-3.5 0-6-2.6-6.2-6.4v-.8Zm1.9-.5h8c-.2-2.5-1.7-4.1-3.9-4.1s-3.8 1.6-4.1 4.1Z"
      fill="currentColor"
    />
    <path d="m14.6 18.4 3.6-4.9-3.3-4.6h1.9l2.4 3.4 2.4-3.4h1.8l-3.3 4.6 3.6 4.9h-2l-2.6-3.7-2.6 3.7h-1.9Z" fill="currentColor" />
  </Svg>
)

const NestJs = (p: P) => (
  <Svg {...p}>
    <path
      d="M9.4 2c-.6 0-1.1.4-1.1 1 0 .3.1.5.3.7.3.4.4.8.2 1.2-1.5 2.4-2 4.9-1.4 7.5.5 2.2 1.8 4 3.7 5.4-2.4-.6-4.2-2-5.3-4.2-1.4-2.8-1.2-5.6.6-8.1-2.9 1.9-4.3 5.6-3.2 9 1 3.3 4 5.5 7.5 5.5 3.9 0 7.1-2.9 7.6-6.7.4-3-1-5.7-3.6-7.2 1.2 1.5 1.6 3.1 1.1 4.9-.5 1.9-1.8 3.1-3.7 3.6 1.5-1.4 2-3 1.4-4.9-.5-1.7-1.7-2.8-3.4-3.3.4-.6.5-1.2.2-1.9-.2-.9-.8-1.5-1.5-1.5Z"
      fill="#E0234E"
    />
  </Svg>
)

/* -------------------------------- mobile ------------------------------- */

const Compose = (p: P) => (
  <Svg {...p}>
    <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" fill="none" stroke="#4285F4" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.4" fill="#3DDC84" />
  </Svg>
)

const Flutter = (p: P) => (
  <Svg {...p}>
    <path d="M13.9 1.4 4.3 11l3 3 12.6-12.6h-6Z" fill="#47C5FB" />
    <path d="M13.8 11.6 8.6 16.8l5.3 5.4h6l-5.2-5.3 5.2-5.3h-6.1Z" fill="#00569E" />
    <path d="m8.6 16.8 3-3 3 3-3 3-3-3Z" fill="#00B5F8" />
  </Svg>
)

/* ------------------------------- database ------------------------------ */

const MySQL = (p: P) => <SqlDb {...p} fill="#00758F" />
const Postgres = (p: P) => <SqlDb {...p} fill="#336791" />

/* --------------------------------- tools ------------------------------- */

const Prisma = (p: P) => (
  <Svg {...p}>
    <path d="M11.2 1.6a1.3 1.3 0 0 1 2 .4l7.2 15.3c.3.6 0 1.3-.6 1.6l-9.6 4.5c-.9.4-1.9-.4-1.7-1.4L12.3 2.3c0-.3.2-.5.4-.7Z" fill="#2D3748" stroke="#5A67D8" strokeWidth="1.1" />
  </Svg>
)

const Git = (p: P) => (
  <Svg {...p}>
    <path d="M23.2 11 13 .8a1.7 1.7 0 0 0-2.4 0L8.5 3l2.7 2.7a2 2 0 0 1 2.6 2.6l2.6 2.6a2 2 0 1 1-1.2 1.2l-2.4-2.4v6.4a2 2 0 1 1-1.7 0V9.6a2 2 0 0 1-1.1-2.6L7.3 4.3.8 10.6a1.7 1.7 0 0 0 0 2.4l10.2 10.2a1.7 1.7 0 0 0 2.4 0l9.8-9.8a1.7 1.7 0 0 0 0-2.4Z" fill="#F05133" />
  </Svg>
)

const GitHubMark = (p: P) => (
  <Svg {...p}>
    <path
      d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.35-1.3-1.71-1.3-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      fill="currentColor"
    />
  </Svg>
)

const Docker = (p: P) => (
  <Svg {...p}>
    <g fill="#2496ED">
      <rect x="3.2" y="10.4" width="3" height="2.8" rx=".3" />
      <rect x="6.7" y="10.4" width="3" height="2.8" rx=".3" />
      <rect x="10.2" y="10.4" width="3" height="2.8" rx=".3" />
      <rect x="13.7" y="10.4" width="3" height="2.8" rx=".3" />
      <rect x="6.7" y="7.2" width="3" height="2.8" rx=".3" />
      <rect x="10.2" y="7.2" width="3" height="2.8" rx=".3" />
      <rect x="10.2" y="4" width="3" height="2.8" rx=".3" />
    </g>
    <path d="M22.6 11.2c-.7-.5-2.3-.6-3.4-.4-.2-1.1-.8-2-1.8-2.8l-.6-.4-.4.6c-.5.8-.7 1.9-.6 2.8H1.6c-.3 2.6.5 5.9 2.5 8 1.9 1.9 4.7 2.9 8.2 2.9 7.6 0 10.4-5.4 11.4-8.3 1 0 2-.4 2.3-1.2l-3.4-1.2Z" fill="#2496ED" />
  </Svg>
)

const Figma = (p: P) => (
  <Svg {...p}>
    <path d="M8.5 24a3.8 3.8 0 0 0 3.8-3.8V16.5H8.5a3.75 3.75 0 1 0 0 7.5Z" fill="#0ACF83" />
    <path d="M4.75 12.25A3.75 3.75 0 0 1 8.5 8.5h3.8v7.5H8.5a3.75 3.75 0 0 1-3.75-3.75Z" fill="#A259FF" />
    <path d="M4.75 4.25A3.75 3.75 0 0 1 8.5.5h3.8V8H8.5a3.75 3.75 0 0 1-3.75-3.75Z" fill="#F24E1E" />
    <path d="M12.3.5h3.7a3.75 3.75 0 1 1 0 7.5h-3.7V.5Z" fill="#FF7262" />
    <path d="M19.75 12.25A3.75 3.75 0 1 1 16 8.5a3.75 3.75 0 0 1 3.75 3.75Z" fill="#1ABCFE" />
  </Svg>
)

/* ------------------------------- concepts ------------------------------ */

const Android = (p: P) => (
  <Svg {...p}>
    <path
      d="M17.2 7.6H6.8a.6.6 0 0 0-.6.6v8.4c0 .6.5 1 1 1h1v3a1.4 1.4 0 0 0 2.8 0v-3h2v3a1.4 1.4 0 0 0 2.8 0v-3h1c.6 0 1-.4 1-1V8.2a.6.6 0 0 0-.6-.6ZM3.9 8a1.4 1.4 0 0 0-1.4 1.4v4.8a1.4 1.4 0 0 0 2.8 0V9.4A1.4 1.4 0 0 0 3.9 8Zm16.2 0a1.4 1.4 0 0 0-1.4 1.4v4.8a1.4 1.4 0 0 0 2.8 0V9.4A1.4 1.4 0 0 0 20.1 8ZM15.4 2.6l.9-1.6a.3.3 0 0 0-.5-.3l-1 1.7a6.5 6.5 0 0 0-5.6 0l-1-1.7a.3.3 0 0 0-.5.3l.9 1.6A5.5 5.5 0 0 0 6.6 6.6h10.8a5.5 5.5 0 0 0-2-4ZM9.6 4.8a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2Zm4.8 0a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2Z"
      fill="#3DDC84"
    />
  </Svg>
)

const Signal = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M5 14a5 5 0 0 1 5-5M2 17a8.5 8.5 0 0 1 8.5-8.5M8 20a2 2 0 0 1 2-2" />
    <circle cx="17" cy="7" r="3" fill="currentColor" stroke="none" />
  </Svg>
)

const Plug = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5" />
  </Svg>
)

const Css3 = (p: P) => (
  <Svg {...p}>
    <path d="M3 2h18l-1.6 18L12 22l-7.4-2L3 2Z" fill="#264DE4" />
    <path d="M12 4.2v15.9l6-1.7L19.3 4.2H12Z" fill="#2965F1" />
    <path d="M7.2 9.6 7.4 12H12V9.6H7.2Zm.4 4.8.2 2.3 4.4 1.2v-2.5l-4.6-1Z" fill="#EBEBEB" />
    <path d="M16.6 9.6H12V12h4.4l-.4 4.3-3.9 1.1v2.5l6.2-1.7.6-6.6H12" fill="#fff" />
  </Svg>
)

const Editor = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2.5" y="3.5" width="19" height="17" rx="3" />
    <path d="M6.5 9h11M6.5 13h8M6.5 17h5" />
  </Svg>
)

const Globe = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9.2" />
    <path d="M2.8 12h18.4M12 2.8c2.4 2.5 3.6 5.7 3.6 9.2S14.4 18.7 12 21.2c-2.4-2.5-3.6-5.7-3.6-9.2S9.6 5.3 12 2.8Z" />
  </Svg>
)

const TypeMark = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M4 6.5V5h16v1.5M12 5v14M8.5 19h7" />
  </Svg>
)

const Accessibility = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="4.2" r="2" fill="currentColor" stroke="none" />
    <path d="M4.5 8.5c4.8 1.6 10.2 1.6 15 0M12 8.5v6M12 14.5l-3 6M12 14.5l3 6" />
  </Svg>
)

const Workflow = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="5" r="2.6" />
    <circle cx="6" cy="19" r="2.6" />
    <circle cx="18" cy="12" r="2.6" />
    <path d="M8.6 5H13a2 2 0 0 1 2 2v3M8.6 19H13a2 2 0 0 0 2-2v-3" />
  </Svg>
)

const Chip = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    <path d="M10 3v3.5M14 3v3.5M10 17.5V21M14 17.5V21M3 10h3.5M3 14h3.5M17.5 10H21M17.5 14H21" strokeLinecap="round" />
  </Svg>
)

const Sync = (p: P) => (
  <Svg {...p} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 9.5a8.5 8.5 0 0 1 14.6-3.4L21 9M20.5 14.5a8.5 8.5 0 0 1-14.6 3.4L3 15" />
    <path d="M21 4v5h-5M3 20v-5h5" />
  </Svg>
)

/* ------------------------------- registry ------------------------------ */

const REGISTRY: Record<string, (p: P) => React.ReactElement> = {
  javascript: JavaScript,
  typescript: TypeScript,
  kotlin: Kotlin,
  dart: Dart,
  sql: SqlDb,
  react: React_,
  'next.js': NextJs,
  nextjs: NextJs,
  'tailwind css': Tailwind,
  tailwindcss: Tailwind,
  'shadcn/ui': Shadcn,
  shadcn: Shadcn,
  bootstrap: Bootstrap,
  'node.js': NodeJs,
  nodejs: NodeJs,
  express: Express,
  nestjs: NestJs,
  'jetpack compose': Compose,
  flutter: Flutter,
  mysql: MySQL,
  postgresql: Postgres,
  postgres: Postgres,
  'prisma orm': Prisma,
  prisma: Prisma,
  git: Git,
  github: GitHubMark,
  'github actions': Workflow,
  docker: Docker,
  figma: Figma,
  android: Android,
  'android ndk': Chip,
  ndk: Chip,
  mqtt: Signal,
  websocket: Plug,
  iot: Chip,
  coroutines: Sync,
  realtime: Sync,
  css: Css3,
  'editor.js': Editor,
  typography: TypeMark,
  accessibility: Accessibility,
  i18n: Globe,
  thai: Globe,
}

/** Renders the mark for a technology name, or nothing when there isn't one. */
export function TechIcon({ name, className }: { name: string; className?: string }) {
  const Icon = REGISTRY[name.trim().toLowerCase()]
  if (!Icon) return null
  return <Icon className={className} />
}

export function hasTechIcon(name: string): boolean {
  return Boolean(REGISTRY[name.trim().toLowerCase()])
}
