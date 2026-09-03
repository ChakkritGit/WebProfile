/**
 * Seasonal dressing for the header.
 *
 * A festival declares the day it actually falls on, not a display window: the
 * window is derived, so "show it a bit earlier and let it linger" is one change
 * here rather than six sets of hand-tuned dates that drift apart over time.
 *
 * Loy Krathong follows the lunar calendar and cannot be a fixed month and day, so
 * it carries a per-year table and simply does not appear in years the table does
 * not cover, rather than showing on the wrong date.
 */

export type FestivalId =
  | 'new-year'
  | 'valentine'
  | 'songkran'
  | 'loy-krathong'
  | 'halloween'
  | 'christmas'

/** Days of build-up before the festival, and of afterglow once it has passed. */
export const DAYS_BEFORE = 5
export const DAYS_AFTER = 3

export type Festival = {
  id: FestivalId
  /** The day it falls on, `[month, day]`, 1-indexed month. */
  on?: [number, number]
  /** Last day, for festivals that run more than one. Defaults to `on`. */
  through?: [number, number]
  /** Gregorian dates per year, for festivals that move with the moon. */
  lunar?: Record<number, [number, number]>
  /** Drives the glyph animation. */
  motion: 'fall' | 'rise' | 'drift' | 'burst'
  /** Tint washed across the top of the header. */
  wash: string
}

export const FESTIVALS: readonly Festival[] = [
  { id: 'new-year', on: [1, 1], motion: 'burst', wash: 'rgb(232 163 23 / 0.18)' },
  { id: 'valentine', on: [2, 14], motion: 'rise', wash: 'rgb(255 90 95 / 0.16)' },
  { id: 'songkran', on: [4, 13], through: [4, 15], motion: 'fall', wash: 'rgb(63 160 255 / 0.18)' },
  {
    id: 'loy-krathong',
    lunar: {
      2025: [11, 5], 2026: [11, 24], 2027: [11, 14], 2028: [11, 2], 2029: [11, 21],
      2030: [11, 10], 2031: [10, 30], 2032: [11, 17], 2033: [11, 6], 2034: [11, 25],
    },
    motion: 'rise',
    wash: 'rgb(232 163 23 / 0.16)',
  },
  { id: 'halloween', on: [10, 31], motion: 'drift', wash: 'rgb(124 92 255 / 0.16)' },
  { id: 'christmas', on: [12, 25], motion: 'fall', wash: 'rgb(35 160 120 / 0.16)' },
]

const DAY = 86_400_000

function midnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Peak `[start, end]` for a festival in a given year, or null if it has none. */
function peakIn(festival: Festival, year: number): [number, number] | null {
  const lunar = festival.lunar?.[year]
  if (lunar) {
    const day = new Date(year, lunar[0] - 1, lunar[1]).getTime()
    return [day, day]
  }
  if (!festival.on) return null
  const start = new Date(year, festival.on[0] - 1, festival.on[1]).getTime()
  const last = festival.through ?? festival.on
  return [start, new Date(year, last[0] - 1, last[1]).getTime()]
}

/**
 * The festival covering `date`, or `null` on an ordinary day.
 *
 * Neighbouring years are checked as well, so New Year's build-up reaches back
 * into December. Where two windows overlap — Christmas's afterglow runs into New
 * Year's build-up — the one whose own day is nearer wins, which needs no ordering
 * rule and keeps working if another festival is added later.
 */
export function festivalOn(date: Date): Festival | null {
  const today = midnight(date)
  const year = date.getFullYear()
  let best: { festival: Festival; distance: number } | null = null

  for (const festival of FESTIVALS) {
    for (const y of [year - 1, year, year + 1]) {
      const peak = peakIn(festival, y)
      if (!peak) continue
      const [start, end] = peak
      if (today < start - DAYS_BEFORE * DAY || today > end + DAYS_AFTER * DAY) continue

      const distance = today < start ? start - today : today > end ? today - end : 0
      if (!best || distance < best.distance) best = { festival, distance }
    }
  }

  return best?.festival ?? null
}

export function festivalById(id: string): Festival | null {
  return FESTIVALS.find((f) => f.id === id) ?? null
}
