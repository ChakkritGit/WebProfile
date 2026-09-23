'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Select } from '@/components/ui/select'
import { buildQuery, type DateFilter as Filter } from '@/lib/search'
import { pinScroll } from '@/lib/pin-scroll'

/**
 * Year, month and order for a listing, written to the URL like every other
 * filter here so the view is shareable. Only years and months that have
 * something in them are offered.
 */
export function DateFilter({
  filter,
  dates,
  keep,
}: {
  filter: Filter
  /** Every `[year, month]` something was published in. */
  dates: [number, number][]
  /** The listing's other parameters (tag, q), carried through unchanged. */
  keep: Record<string, string | undefined>
}) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const years = [...new Set(dates.map(([y]) => y))].sort((a, b) => b - a)
  const monthsIn = (year?: number) =>
    [...new Set(dates.filter(([y]) => !year || y === year).map(([, m]) => m))].sort((a, b) => a - b)
  const months = monthsIn(filter.year)

  const monthName = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale === 'ja' ? 'ja-JP' : 'en-GB', {
    month: 'long',
    timeZone: 'UTC',
  })
  const nameOf = (month: number) => monthName.format(new Date(Date.UTC(2000, month - 1, 1)))
  // Buddhist-era years would disagree with the URL's; the numbers stay Gregorian.
  const yearLabel = (year: number) => String(year)

  function go(next: Partial<Filter>) {
    const merged = { ...filter, ...next }
    // A month the chosen year has nothing in would only empty the list.
    const month = merged.month && !monthsIn(merged.year).includes(merged.month) ? undefined : merged.month
    pinScroll()
    startTransition(() =>
      router.replace(
        `${pathname}${buildQuery({
          ...keep,
          year: merged.year,
          month,
          sort: merged.sort === 'old' ? 'old' : undefined,
        })}`,
        { scroll: false },
      ),
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label={t('filterYear')}
        value={filter.year ? String(filter.year) : ''}
        options={[{ value: '', label: t('anyYear') }, ...years.map((y) => ({ value: String(y), label: yearLabel(y) }))]}
        onChange={(value) => go({ year: value ? Number(value) : undefined })}
        className="w-36"
      />
      <Select
        label={t('filterMonth')}
        value={filter.month ? String(filter.month) : ''}
        options={[{ value: '', label: t('anyMonth') }, ...months.map((m) => ({ value: String(m), label: nameOf(m) }))]}
        onChange={(value) => go({ month: value ? Number(value) : undefined })}
        className="w-40"
      />
      <Select
        label={t('sortLabel')}
        value={filter.sort}
        options={[
          { value: 'new', label: t('sortNewest') },
          { value: 'old', label: t('sortOldest') },
        ]}
        onChange={(value) => go({ sort: value === 'old' ? 'old' : 'new' })}
        className="w-40"
      />
    </div>
  )
}
