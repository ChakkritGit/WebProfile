/** Nav is data — adding a future module means adding one entry here. */
export const navItems = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'projects', href: '/projects' },
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
] as const

export type NavKey = (typeof navItems)[number]['key']
