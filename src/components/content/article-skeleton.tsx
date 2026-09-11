import { Container } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * What an article looks like while it is being fetched.
 *
 * Without this the nearest loading state was the listing's, one segment up, so
 * tapping a card replaced the list with a skeleton of *the list* — a grid of
 * cards where an article was supposed to be arriving. A route gets the closest
 * one, so this sits with the article.
 *
 * Shaped to `ArticleShell`: the header band with its title and meta, then the
 * column, with the outline and reading controls beside it from `lg`.
 */
export function ArticleSkeleton() {
  return (
    <article role="status" aria-busy="true" className="pb-16">
      <span className="sr-only">Loading</span>

      <div className="drawn-rule paper-grain bg-paper-alt relative overflow-hidden">
        <Container className="relative z-10 py-12 sm:py-16">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-6 h-9 w-full max-w-3xl sm:h-12" />
          <Skeleton className="mt-3 h-9 w-2/3 max-w-2xl sm:h-12" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {['w-20', 'w-16', 'w-24', 'w-14'].map((w, i) => (
              <Skeleton key={i} className={`h-7 rounded-full ${w}`} />
            ))}
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <div className="min-w-0 space-y-4">
            {['w-full', 'w-11/12', 'w-full', 'w-4/5'].map((w, i) => (
              <Skeleton key={i} className={`h-5 ${w}`} />
            ))}
            <Skeleton className="!mt-8 aspect-[16/9] w-full" />
            {['w-full', 'w-10/12', 'w-full', 'w-3/4', 'w-11/12'].map((w, i) => (
              <Skeleton key={`b-${i}`} className={`h-5 ${w}`} />
            ))}
          </div>

          <div className="hidden lg:block lg:space-y-4">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Container>
    </article>
  )
}
