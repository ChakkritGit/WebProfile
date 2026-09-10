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
 * next as long as both carry the same `view-transition-name` and the navigation
 * happens inside `startViewTransition`. The name goes on the card itself rather
 * than on anything inside it: what should expand is the container — Material's
 * container transform, a card growing into the page it opens — and naming the
 * title alone got a line of text flying over a page that had already changed. Next 16.3 and React 19.2 have no integration for it
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
      data-vt={name}
      style={{ viewTransitionName: name }}
      onClick={(event) => {
        // Let the browser have the ones it should: new tabs, downloads, and any
        // click with a modifier held.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        if (!document.startViewTransition) return

        event.preventDefault()
        document.startViewTransition(async () => {
          router.push(href)
          await arrival(href)
        })
      }}
      {...rest}
    >
      {children}
    </Link>
  )
}

/**
 * Resolves once the browser is actually somewhere else.
 *
 * It waited for the named element to appear, which was useless the moment the
 * name moved onto the card: the card it was clicked from carries that name too,
 * so the wait was already satisfied and the transition ended before the new page
 * had rendered — a morph from the page to itself, which is to say none.
 * The address is the thing that only changes on arrival.
 *
 * The timeout is a promise to the browser rather than a fallback: a view
 * transition freezes the page while it waits, so a navigation that never lands
 * must not freeze it for ever.
 */
function arrival(href: string) {
  return new Promise<void>((resolve) => {
    const target = new URL(href, location.origin).pathname
    const arrived = () => decodeURIComponent(location.pathname).startsWith(decodeURIComponent(target))

    const timer = setTimeout(stop, 900)
    const tick = setInterval(() => {
      if (arrived()) stop()
    }, 30)

    function stop() {
      clearTimeout(timer)
      clearInterval(tick)
      // Two frames: one for the new tree to commit, one for it to be laid out
      // before the browser photographs it.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    }
  })
}
