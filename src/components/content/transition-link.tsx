'use client'

import type { ReactNode } from 'react'
// The locale-aware pair, not `next/link` and `next/navigation`: these are the
// ones that know `/blog/x` is `/en/blog/x` on the English site, and swapping
// them out here would have quietly dropped the prefix from every card.
import { Link, useRouter } from '@/i18n/navigation'

/**
 * A link that hands the old page to the new one.
 *
 * The browser can morph an element from one page into its counterpart on the
 * next — a card's title flying into the article's heading — as long as both
 * carry the same `view-transition-name` and the navigation happens inside
 * `startViewTransition`. Next 16.3 and React 19.2 have no integration for it
 * yet, so the navigation is wrapped here.
 *
 * The wait is the whole trick. `startViewTransition` takes its "after" snapshot
 * when the callback settles, and `router.push` returns long before the new page
 * has rendered — so without waiting the browser would photograph the old page
 * twice and cross-fade nothing into nothing. The callback therefore holds until
 * the counterpart element actually appears in the document.
 *
 * Anything without the API — Firefox and Safari before 18 — falls through to an
 * ordinary `Link`, which is what this is anyway.
 */
export function TransitionLink({
  href,
  name,
  className,
  children,
  ...rest
}: {
  href: string
  /** The `view-transition-name` shared with the element on the far side. */
  name: string
  className?: string
  children: ReactNode
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>) {
  const router = useRouter()

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        // Let the browser have the ones it should: new tabs, downloads, and any
        // click with a modifier held.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        if (!document.startViewTransition) return

        event.preventDefault()
        document.startViewTransition(async () => {
          router.push(href)
          await arrival(name)
        })
      }}
      {...rest}
    >
      {children}
    </Link>
  )
}

/**
 * Resolves once the named element is on the page, or after a moment either way.
 *
 * The timeout is not a fallback so much as a promise to the browser: a view
 * transition freezes the page while it waits, so a navigation that never
 * completes must not freeze it for ever.
 */
function arrival(name: string) {
  return new Promise<void>((resolve) => {
    const found = () => document.querySelector(`[data-vt="${CSS.escape(name)}"]`)
    if (found()) return resolve()

    const observer = new MutationObserver(() => {
      if (!found()) return
      stop()
    })
    const timer = setTimeout(stop, 700)

    function stop() {
      clearTimeout(timer)
      observer.disconnect()
      // One frame, so the new element is laid out before it is photographed.
      requestAnimationFrame(() => resolve())
    }

    observer.observe(document.body, { childList: true, subtree: true })
  })
}
