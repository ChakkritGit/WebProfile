// Run: npx tsx --test src/lib/utils.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayOfMonth, yearMonthOf } from './utils'

test('dates are read in Bangkok, not UTC', () => {
  // 20:00 UTC on 31 Dec is 03:00 on 1 Jan in Bangkok.
  assert.deepEqual(yearMonthOf('2025-12-31T20:00:00Z'), { year: 2026, month: 1 })
  assert.equal(dayOfMonth('2025-12-31T20:00:00Z'), '01')
  assert.equal(yearMonthOf(null), null)
  assert.equal(yearMonthOf('not a date'), null)
})
