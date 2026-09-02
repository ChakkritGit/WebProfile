/**
 * Single source of truth for personal data.
 * Sourced from Resume-en.pdf and the previous ReactPortfolio project.
 * Adding a new section/module? Extend the typed shapes here first.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://chakkritton.com'

/** Domain used for the Thai webring anchor (`webring.wonderful.software#<domain>`). */
export const WEBRING_DOMAIN = SITE_URL.replace(/^https?:\/\//, '')

/**
 * First day at Thanes Development. Years of experience are derived from this at
 * render time so the number never goes stale.
 */
export const CAREER_START = '2023-06-01'

export function yearsOfExperience(from: string = CAREER_START, now: Date = new Date()) {
  const start = new Date(from)
  const years = (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(1, Math.floor(years))
}

export const profile = {
  name: 'Chakkrit Laolit',
  nickname: 'Ton',
  handle: 'chakkritton',
  role: 'Software Engineer',
  company: 'Thanes Development Co., Ltd.',
  location: 'Chatuchak, Bangkok, Thailand',
  email: 'chakkritlaolit@hotmail.com',
  phone: '+66923305956',
  phoneDisplay: '092 330 5956',
  resume: '/Resume-en.pdf',
  avatar: '/images/avatar.jpg',
  /** Short label for the header/logo lockup. */
  brand: 'Chakkrit',
} as const

export const socials = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/ChakkritGit', handle: '@ChakkritGit' },
  { id: 'email', label: 'Email', href: `mailto:${profile.email}`, handle: profile.email },
  { id: 'phone', label: 'Phone', href: `tel:${profile.phone}`, handle: profile.phoneDisplay },
  { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/ton.chakkrit22', handle: 'ton.chakkrit22' },
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/__Konmek', handle: '@__Konmek' },
  { id: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@__tonchakkrit', handle: '@__tonchakkrit' },
] as const

export type SocialId = (typeof socials)[number]['id']

/** Icons shown in the always-visible quick-contact dock. */
export const QUICK_CONTACT: SocialId[] = ['github', 'email', 'phone']

export const skillGroups = [
  { id: 'languages', items: ['JavaScript', 'TypeScript', 'Kotlin', 'Dart', 'SQL'] },
  { id: 'frontend', items: ['React', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'Bootstrap'] },
  { id: 'backend', items: ['Node.js', 'Express', 'NestJS'] },
  { id: 'mobile', items: ['Jetpack Compose', 'Flutter'] },
  { id: 'database', items: ['MySQL', 'PostgreSQL'] },
  { id: 'tools', items: ['Prisma ORM', 'Git', 'GitHub', 'Docker', 'Figma'] },
] as const

export type SkillGroupId = (typeof skillGroups)[number]['id']

export const experience = [
  {
    id: 'thanes',
    company: 'Thanes Development Co., Ltd.',
    start: '2023-06-01',
    end: null as string | null,
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'NestJS', 'Kotlin'],
    projects: ['smtrack', 'conhis', 'ward-stock'],
  },
] as const

export const education = [
  {
    id: 'nrru',
    school: 'Nakhon Ratchasima Rajabhat University',
    start: '2018-05-01',
    end: '2022-05-01',
    gpa: '3.04',
  },
] as const

export const languages = [
  { id: 'thai', speaking: 5, reading: 5, writing: 5 },
  { id: 'english', speaking: 3, reading: 4, writing: 3 },
] as const
