import { Container, Section } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * What a listing looks like while its query is still running.
 *
 * The blog and projects pages read `searchParams`, which makes them dynamic:
 * nothing can be prerendered and nothing can be prefetched, so a tap on "Blog"
 * used to leave the previous page on screen for as long as the database took —
 * measured on a throttled phone, 372ms warm and 2.5s cold. As a `loading.tsx`
 * this hands the route its shell immediately and the rows arrive into it.
 *
 * Shaped to the real page rather than a spinner, and with the same header band,
 * so the swap moves as little as possible: heading, search box, tag row, count,
 * then the card grid.
 */
export function ListingSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading</span>

      <div className="drawn-rule paper-grain bg-paper-alt relative overflow-hidden">
        <Container className="relative z-10 py-12 sm:py-16">
          <Skeleton className="h-10 w-64 sm:h-12 lg:h-14" />
          <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
        </Container>
      </div>

      <Section>
        <div className="space-y-5">
          <Skeleton className="h-11 w-full max-w-xl rounded-full" />
          <div className="flex flex-wrap gap-1.5">
            {['w-16', 'w-24', 'w-20', 'w-28', 'w-14', 'w-24'].map((w, i) => (
              <Skeleton key={i} className={`h-7 rounded-full ${w}`} />
            ))}
          </div>
          <Skeleton className="h-5 w-24" />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="sticker bg-surface overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
