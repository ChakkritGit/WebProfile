'use client'

import type { ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

/**
 * A card that opens by growing into the page.
 *
 * A plain `<a>`, deliberately. The browser has cross-document view transitions:
 * both pages opt in with `@view-transition` in the stylesheet, both name the
 * element that should morph, and the browser holds the old page on screen until
 * the new one is ready and then plays the transform. No script, and the timing
 * is the browser's — which is the part that cannot be got right from outside.
 *
 * The client-side version came first and was measured: wrapping `router.push` in
 * `startViewTransition` took 4.08s to change page against 0.2s for an ordinary
 * link, because a view transition freezes the document while it waits and React
 * cannot commit the new route inside that freeze. It hung, then changed with no
 * animation — the worst of both. Next 16.3 and React 19.2 have no integration
 * for this yet; when they do, this goes back to being a `Link`.
 *
 * The cost is the client-side navigation for these links: a card opens with a
 * real page load. The pages are cached, and the transition covers the wait,
 * which is what it is for.
 */
export function TransitionLink({
  href,
  name,
  className,
  children,
}: {
  /** Unlocalised, as everywhere else in the app: `/blog/some-slug`. */
  href: string
  /** The `view-transition-name` shared with the page this opens. */
  name: string
  className?: string
  children: ReactNode
}) {
  const locale = useLocale()
  // `localePrefix: 'as-needed'` — the default locale carries no prefix, and
  // building the href here is the price of not going through the router's Link.
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return (
    <a
      href={`${prefix}${href}`}
      data-vt={name}
      style={{ viewTransitionName: name }}
      className={className}
    >
      {children}
    </a>
  )
}
