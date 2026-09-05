import type { SVGProps } from 'react'
import {
  ALargeSmall,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Code,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Eye,
  Globe,
  GraduationCap,
  Layers,
  List,
  Mail,
  MapPin,
  Menu,
  Monitor,
  Moon,
  Network,
  Pencil,
  Phone,
  Plus,
  Rss,
  Search,
  Sparkles,
  Sun,
  Tag,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'

/**
 * The icon set.
 *
 * Lucide for everything it draws, aliased to the names the app already uses —
 * thirty-five icons changed hands without a single call site being touched. The
 * set that was here before was hand-built to match a drawn interface; keeping it
 * would have meant maintaining a private icon library for no remaining reason.
 *
 * Four marks stay local. Lucide dropped its brand icons, and GitHub, Facebook,
 * Instagram and TikTok are logos rather than icons — they are wrong when they are
 * approximate, so they are kept as the geometry they actually are.
 */
type IconProps = SVGProps<SVGSVGElement>

export const MailIcon = Mail
export const PhoneIcon = Phone
export const MapPinIcon = MapPin
export const SunIcon = Sun
export const MoonIcon = Moon
export const MonitorIcon = Monitor
export const GlobeIcon = Globe
export const MenuIcon = Menu
export const CloseIcon = X
export const ArrowRightIcon = ArrowRight
export const ArrowUpIcon = ArrowUp
export const DownloadIcon = Download
export const ExternalLinkIcon = ExternalLink
export const SparkleIcon = Sparkles
export const CopyIcon = Copy
export const CheckIcon = Check
export const ClockIcon = Clock
export const CalendarIcon = Calendar
export const BriefcaseIcon = Briefcase
export const CapIcon = GraduationCap
export const CodeIcon = Code
export const ListIcon = List
/** Two sizes of the same letter — the reading-size control, not a font picker. */
export const TextSizeIcon = ALargeSmall
export const PencilIcon = Pencil
export const PlusIcon = Plus
export const TrashIcon = Trash2
export const EyeIcon = Eye
export const LayersIcon = Layers
export const CrownIcon = Crown
export const ThumbsUpIcon = ThumbsUp
export const RssIcon = Rss
/** A sitemap is a network of pages, and that is the shape Lucide gives it. */
export const SitemapIcon = Network
export const SearchIcon = Search
export const TagIcon = Tag
export const ChevronDownIcon = ChevronDown

/* ------------------------------- brands -------------------------------- */

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
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

export const GitHubIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.2 4 18.2 4.3 18.2 4.3c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
  </Solid>
)

export const FacebookIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </Solid>
)

export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x={2.5} y={2.5} width={19} height={19} rx={5.5} />
    <circle cx={12} cy={12} r={4} />
    <circle cx={17.6} cy={6.4} r={1.1} fill="currentColor" stroke="none" />
  </Stroke>
)

/**
 * The mark between sections: two rules and three stars.
 *
 * Not an icon and not from the icon set — it is a piece of punctuation, and the
 * only ornament kept from the drawn language, because a section break that is
 * merely a gap reads as a page that lost something.
 */
export const DelimiterMark = (p: IconProps) => (
  <svg viewBox="0 0 84 16" fill="none" aria-hidden="true" {...p}>
    <path
      d="M8 8h14M62 8h14"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M42 3 43.3 6.7 47 8 43.3 9.3 42 13 40.7 9.3 37 8 40.7 6.7ZM31 5.6 31.9 7.5 33.8 8.4 31.9 9.3 31 11.2 30.1 9.3 28.2 8.4 30.1 7.5ZM53 5.6 53.9 7.5 55.8 8.4 53.9 9.3 53 11.2 52.1 9.3 50.2 8.4 52.1 7.5Z"
      fill="currentColor"
      opacity="0.55"
    />
  </svg>
)

export const TikTokIcon = (p: IconProps) => (
  <Solid {...p}>
    <path d="M16.5 2h-3v13.2a2.9 2.9 0 1 1-2.4-2.85V9.3a6.1 6.1 0 1 0 5.4 6.05V8.9a7 7 0 0 0 4 1.27V7.13A4.1 4.1 0 0 1 16.5 2Z" />
  </Solid>
)
