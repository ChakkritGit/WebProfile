/** Nav is data — adding a future module means adding one entry here. */
export const navItems = [
  { key: 'home', href: '/' },
  { key: 'blog', href: '/blog' },
  { key: 'projects', href: '/projects' },
  { key: 'topics', href: '/topics' },
  { key: 'about', href: '/about' },
] as const

export type NavKey = (typeof navItems)[number]['key']
