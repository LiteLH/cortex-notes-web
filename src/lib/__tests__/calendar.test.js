import { describe, it, expect } from 'vitest'

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

function getNoteDates(notes) {
  const dates = new Set()
  for (const note of notes) {
    if (note.created_at) {
      const d = new Date(note.created_at)
      if (!isNaN(d.getTime())) {
        dates.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        )
      }
    }
  }
  return dates
}

describe('calendar utilities', () => {
  it('gets correct days in month', () => {
    expect(getMonthDays(2026, 1)).toBe(28) // Feb 2026
    expect(getMonthDays(2026, 0)).toBe(31) // Jan 2026
  })

  it('gets first day of week', () => {
    // Feb 1, 2026 is a Sunday = 0
    expect(getFirstDayOfWeek(2026, 1)).toBe(0)
  })

  it('extracts note dates', () => {
    const notes = [
      { created_at: '2026-02-14T10:00:00Z' },
      { created_at: '2026-02-14T15:00:00Z' },
      { created_at: '2026-02-15T10:00:00Z' },
      { created_at: null },
    ]
    const dates = getNoteDates(notes)
    expect(dates.size).toBe(2)
    expect(dates.has('2026-02-14')).toBe(true)
    expect(dates.has('2026-02-15')).toBe(true)
  })
})
