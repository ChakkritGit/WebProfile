import { redirect } from '@/i18n/navigation'

/**
 * Contact moved into `/about`. Kept as a redirect so links already shared —
 * and the old sitemap entry search engines still hold — land on it.
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect({ href: '/about#contact', locale })
}
