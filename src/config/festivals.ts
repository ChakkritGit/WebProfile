/**
 * Seasonal dressing for the header.
 *
 * Each festival owns a date window, a palette and a set of drifting glyphs. The
 * windows are inclusive and may wrap the year end, which New Year does.
 *
 * Loy Krathong follows the lunar calendar, so it cannot be expressed as a fixed
 * month and day — it gets a per-year table instead, and simply does not appear in
 * years the table does not cover rather than showing on the wrong date.
 */

export type FestivalId =
  | 'new-year'
  | 'valentine'
  | 'songkran'
  | 'loy-krathong'
  | 'halloween'
  | 'christmas'

export type Festival = {
  id: FestivalId
  /** `[month, day]`, 1-indexed month. Inclusive. */
  from?: [number, number]
  to?: [number, number]
  /** Gregorian dates per year, for festivals that move with the moon. */
  lunar?: Record<number, [number, number]>
  /** How many days either side of a lunar date to keep the dressing up. */
  lunarWindow?: number
  /** Drives the glyph animation: falling, rising or drifting across. */
  motion: 'fall' | 'rise' | 'drift'
  /** Tint washed across the top of the header. */
  wash: string
}

export const FESTIVALS: readonly Festival[] = [
  // Christmas is listed before New Year so the two windows cannot both match on
  // the 26th–28th; the first match wins.
  { id: 'christmas', from: [12, 18], to: [12, 27], motion: 'fall', wash: 'rgb(35 160 120 / 0.16)' },
  { id: 'new-year', from: [12, 28], to: [1, 3], motion: 'rise', wash: 'rgb(232 163 23 / 0.18)' },
  { id: 'valentine', from: [2, 12], to: [2, 15], motion: 'rise', wash: 'rgb(255 90 95 / 0.16)' },
  { id: 'songkran', from: [4, 12], to: [4, 16], motion: 'fall', wash: 'rgb(63 160 255 / 0.18)' },
  {
    id: 'loy-krathong',
    lunar: {
      2025: [11, 5], 2026: [11, 24], 2027: [11, 14], 2028: [11, 2], 2029: [11, 21],
      2030: [11, 10], 2031: [10, 30], 2032: [11, 17], 2033: [11, 6], 2034: [11, 25],
    },
    lunarWindow: 1,
    motion: 'rise',
    wash: 'rgb(232 163 23 / 0.16)',
  },
  { id: 'halloween', from: [10, 27], to: [11, 1], motion: 'drift', wash: 'rgb(124 92 255 / 0.16)' },
]

function withinWindow(date: Date, from: [number, number], to: [number, number]) {
  const key = (date.getMonth() + 1) * 100 + date.getDate()
  const start = from[0] * 100 + from[1]
  const end = to[0] * 100 + to[1]
  // A window that ends before it starts has wrapped into the next year.
  return start <= end ? key >= start && key <= end : key >= start || key <= end
}

/** The festival covering `date`, or `null` on an ordinary day. */
export function festivalOn(date: Date): Festival | null {
  for (const festival of FESTIVALS) {
    if (festival.from && festival.to && withinWindow(date, festival.from, festival.to)) {
      return festival
    }
    const peak = festival.lunar?.[date.getFullYear()]
    if (peak) {
      const target = new Date(date.getFullYear(), peak[0] - 1, peak[1])
      const days = Math.abs(date.getTime() - target.getTime()) / 86_400_000
      if (days <= (festival.lunarWindow ?? 1)) return festival
    }
  }
  return null
}

export function festivalById(id: string): Festival | null {
  return FESTIVALS.find((f) => f.id === id) ?? null
}
