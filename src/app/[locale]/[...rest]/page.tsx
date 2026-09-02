import { notFound } from 'next/navigation'

/**
 * Catch-all so unmatched URLs resolve *inside* the `[locale]` segment.
 *
 * Without this, a path like `/nope` matches no route at all and Next falls
 * back to its built-in global 404 — bypassing `[locale]/not-found.tsx` and the
 * site layout entirely. Routing it here means the themed not-found page and
 * the header/footer render as intended.
 */
export default function CatchAllNotFound(): never {
  notFound()
}
