export interface Item {
  id: string
  kind: 'post' | 'project'
  locale: 'th' | 'en'
  group: string
  slug: string
  url: string
  title: string
  summary: string
  tags: string[]
  stack: string[]
  minutes: number
  cover: string | null
}
export type Lang = 'th' | 'en'
export interface Msg {
  role: 'user' | 'assistant'
  content: string
}
export interface Env {
  AI: Ai
  LIMITER: RateLimit
  SITE: string
  ALLOWED_ORIGINS: string
}
