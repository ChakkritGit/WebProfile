'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { pinScroll } from '@/lib/pin-scroll'

/**
 * A locale-aware link that keeps the reader's scroll position.
 *
 * Used for controls that refine what is already on screen — filters, paging —
 * where jumping to the top of the document loses the reader's place.
 */
export function PinLink({
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      {...props}
      scroll={false}
      onClick={(event) => {
        pinScroll()
        onClick?.(event)
      }}
    >
      {children}
    </Link>
  )
}
