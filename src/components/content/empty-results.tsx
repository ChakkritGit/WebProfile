import { getTranslations } from 'next-intl/server'
import { StickerCard } from '@/components/ui/sticker-card'
import { ButtonLink } from '@/components/ui/button'
import { SearchIcon } from '@/components/icons'

export async function EmptyResults({
  query,
  hasFilters,
  basePath,
  fallback,
}: {
  query: string
  hasFilters: boolean
  basePath: string
  /** Shown when there is simply no content yet, rather than no match. */
  fallback: string
}) {
  const t = await getTranslations('common')

  return (
    <StickerCard className="mt-6 p-12 text-center">
      <SearchIcon aria-hidden className="text-muted mx-auto size-9" />
      <p className="font-display mt-4 text-xl font-bold">
        {hasFilters ? (query ? t('noResults', { query }) : t('empty')) : fallback}
      </p>
      <p className="text-muted mt-2">{hasFilters ? t('noResultsHint') : t('emptyHint')}</p>
      {hasFilters && (
        <ButtonLink href={basePath} variant="secondary" size="sm" className="mt-5">
          {t('clearFilters')}
        </ButtonLink>
      )}
    </StickerCard>
  )
}
