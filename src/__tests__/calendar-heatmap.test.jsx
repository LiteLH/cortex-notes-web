import { describe, it, expect } from 'vitest'
import { getHeatmapColor } from '../components/Calendar.jsx'

describe('getHeatmapColor', () => {
  it('returns empty string for 0 notes', () => {
    expect(getHeatmapColor(0)).toBe('')
  })

  it('returns light color for 1 note', () => {
    expect(getHeatmapColor(1)).toBe('bg-blue-100')
  })

  it('returns medium color for 2-3 notes', () => {
    expect(getHeatmapColor(2)).toBe('bg-blue-200')
    expect(getHeatmapColor(3)).toBe('bg-blue-200')
  })

  it('returns dark color for 4+ notes', () => {
    expect(getHeatmapColor(4)).toBe('bg-blue-300')
    expect(getHeatmapColor(10)).toBe('bg-blue-300')
  })
})
