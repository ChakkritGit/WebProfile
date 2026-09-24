import type { SVGProps } from 'react'

/**
 * Every interface icon is Lucide's. The names are this file's own so the call
 * sites never learned which set they came from — swapping the set was this file.
 *
 * Lucide carries no brand marks (it dropped them on purpose), so the logos below
 * are the brands' own single-path glyphs, filled rather than stroked.
 */
export {
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Monitor as MonitorIcon,
  Globe as GlobeIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  Download as DownloadIcon,
  ExternalLink as ExternalLinkIcon,
  Sparkles as SparkleIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Clock as ClockIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as CapIcon,
  Code as CodeIcon,
  List as ListIcon,
  ALargeSmall as TextSizeIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  Layers as LayersIcon,
  Rss as RssIcon,
  Network as SitemapIcon,
  Search as SearchIcon,
  Tag as TagIcon,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react'

type IconProps = SVGProps<SVGSVGElement>

const Solid = ({ children, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    {children}
  </svg>
)

export const GitHubIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.08 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
  </Solid>
)

export const FacebookIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </Solid>
)

export const XIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M18.24 2.25h3.31l-7.23 8.26L22.83 21.75h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12Z" />
  </Solid>
)

export const BlueskyIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 10.8C10.91 8.69 7.95 4.75 5.2 2.81 2.57.94 1.56 1.27.9 1.57.14 1.91 0 3.08 0 3.77c0 .69.38 5.65.62 6.48.82 2.73 3.72 3.66 6.39 3.36l.41-.05-.41.05c-3.92.59-7.39 2.01-2.84 7.08 5.02 5.19 6.87-1.11 7.83-4.31.95 3.2 2.05 9.27 7.73 4.31 4.27-4.31 1.17-6.5-2.74-7.08l-.42-.05.42.05c2.67.3 5.56-.63 6.38-3.36.25-.83.63-5.79.63-6.48 0-.69-.14-1.86-.9-2.2-.66-.3-1.67-.63-4.3 1.24C16.05 4.75 13.09 8.69 12 10.8Z" />
  </Solid>
)

export const ThreadsIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
  </Solid>
)

export const InstagramIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
  </Solid>
)

export const TikTokIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M16.5 2h-3v13.2a2.9 2.9 0 1 1-2.4-2.85V9.3a6.1 6.1 0 1 0 5.4 6.05V8.9a7 7 0 0 0 4 1.27V7.13A4.1 4.1 0 0 1 16.5 2Z" />
  </Solid>
)

/** The article delimiter: a rule with a square in the middle. */
export const DelimiterMark = (p: IconProps) => (
  <svg viewBox="0 0 84 16" fill="none" aria-hidden="true" {...p}>
    <path d="M4 8h32M48 8h32" stroke="currentColor" strokeWidth="1" />
    <rect x="38" y="4" width="8" height="8" fill="currentColor" />
  </svg>
)
