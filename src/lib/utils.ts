import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The zone every date on this site is read in.
 *
 * Without it `Intl` uses the runtime's, which on the server is UTC — so a post
 * published at two in the morning in Bangkok, seven in the evening UTC the day
 * before, was dated the previous day everywhere it appeared. Pinned rather than
 * taken from the reader, so the date is the same on the server and in the
 * browser and does not shift depending on who is looking.
 */
const ZONE = 'Asia/Bangkok'

/** Locale-aware date formatting shared by cards, article headers and the studio. */
export function formatDate(value: string | Date | null | undefined, locale: string): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: ZONE,
  }).format(date)
}

export function formatMonthYear(value: string | Date | null | undefined, locale: string): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    timeZone: ZONE,
  }).format(date)
}
