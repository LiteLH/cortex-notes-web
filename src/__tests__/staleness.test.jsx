import { describe, it, expect } from 'vitest'
import { getStalenessInfo } from '../components/StalenessIndicator.jsx'

const daysAgo = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

describe('getStalenessInfo', () => {
  it('returns null for recent notes', () => {
    expect(getStalenessInfo({ note_type: 'learning', created_at: daysAgo(30) })).toBeNull()
  })

  it('returns warning for learning > 90 days', () => {
    const result = getStalenessInfo({ note_type: 'learning', created_at: daysAgo(100) })
    expect(result).not.toBeNull()
    expect(result.level).toBe('warning')
    expect(result.message).toContain('過時')
  })

  it('returns warning for decision > 90 days without next_review', () => {
    const result = getStalenessInfo({ note_type: 'decision', created_at: daysAgo(100) })
    expect(result).not.toBeNull()
    expect(result.message).toContain('回顧日期')
  })

  it('returns null for decision with next_review set', () => {
    const result = getStalenessInfo({
      note_type: 'decision',
      created_at: daysAgo(100),
      next_review: '2026-03-01',
    })
    expect(result).toBeNull()
  })

  it('returns info for thought > 90 days', () => {
    const result = getStalenessInfo({ note_type: 'thought', created_at: daysAgo(100) })
    expect(result.level).toBe('info')
  })

  it('returns warning for meeting > 30 days', () => {
    const result = getStalenessInfo({ note_type: 'meeting', created_at: daysAgo(35) })
    expect(result).not.toBeNull()
    expect(result.level).toBe('info')
  })

  it('returns null for notes without note_type', () => {
    expect(getStalenessInfo({ created_at: daysAgo(200) })).toBeNull()
  })
})
