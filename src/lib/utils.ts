import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Locale-aware date formatting shared by cards, article headers and the studio. */
export function formatDate(value: string | Date | null | undefined, locale: string): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatMonthYear(value: string | Date | null | undefined, locale: string): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
  }).format(date)
}
