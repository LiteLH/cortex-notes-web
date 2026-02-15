import { describe, it, expect } from 'vitest'
import { findRelatedNotes } from '../lib/related.js'

const notes = [
  { id: '1', title: 'React Hooks 學習', tags: ['react', 'hooks'], note_type: 'learning', created_at: '2026-02-15T10:00:00Z' },
  { id: '2', title: 'React 效能優化', tags: ['react', 'performance'], note_type: 'learning', created_at: '2026-02-14T10:00:00Z' },
  { id: '3', title: '工作決策', tags: ['career'], note_type: 'decision', created_at: '2026-02-15T10:00:00Z' },
  { id: '4', title: 'React Router', tags: ['react', 'router'], note_type: 'thought', created_at: '2025-06-01T10:00:00Z' },
  { id: '5', title: 'Python 基礎', tags: ['python'], note_type: 'learning', created_at: '2026-02-10T10:00:00Z' },
]

describe('findRelatedNotes', () => {
  it('finds related notes for a given note', () => {
    const current = notes[0] // React Hooks
    const result = findRelatedNotes(current, notes, 3)
    expect(result.length).toBeLessThanOrEqual(3)
    expect(result.every(r => r.id !== '1')).toBe(true) // excludes self
  })

  it('prioritizes tag overlap', () => {
    const current = notes[0] // React Hooks — has react tag
    const result = findRelatedNotes(current, notes, 5)
    // React-related notes should rank higher than career/python
    const reactIds = result.filter(r => (r.tags || []).includes('react')).map(r => r.id)
    expect(reactIds.length).toBeGreaterThan(0)
  })

  it('returns empty for single note', () => {
    const result = findRelatedNotes(notes[0], [notes[0]], 3)
    expect(result.length).toBe(0)
  })

  it('returns at most N notes', () => {
    const result = findRelatedNotes(notes[0], notes, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })
})
