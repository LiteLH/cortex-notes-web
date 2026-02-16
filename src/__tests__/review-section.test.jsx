import { describe, it, expect } from 'vitest'
import { getDueForReview } from '../components/ReviewSection.jsx'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const today = toLocalDateStr(new Date())
const yesterday = toLocalDateStr(new Date(Date.now() - 86400000))
const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000))

describe('getDueForReview', () => {
  it('returns notes with next_review <= today', () => {
    const notes = [
      { id: '1', title: 'Due', next_review: yesterday },
      { id: '2', title: 'Today', next_review: today },
      { id: '3', title: 'Future', next_review: tomorrow },
      { id: '4', title: 'No review' },
    ]
    const result = getDueForReview(notes)
    expect(result.length).toBe(2)
    expect(result.map(n => n.id)).toEqual(['1', '2'])
  })

  it('returns empty array when no reviews due', () => {
    const notes = [{ id: '1', next_review: tomorrow }]
    expect(getDueForReview(notes).length).toBe(0)
  })

  it('sorts by next_review ascending (most overdue first)', () => {
    const twoDaysAgo = toLocalDateStr(new Date(Date.now() - 2 * 86400000))
    const notes = [
      { id: '1', next_review: yesterday },
      { id: '2', next_review: twoDaysAgo },
    ]
    const result = getDueForReview(notes)
    expect(result[0].id).toBe('2')
  })
})
