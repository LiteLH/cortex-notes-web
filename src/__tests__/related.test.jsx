import { describe, it, expect } from 'vitest'
import { findRelatedNotes } from '../lib/related.js'

const notes = [
  {
    id: '1',
    title: 'React Hooks 學習',
    tags: ['react', 'hooks'],
    note_type: 'learning',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'React 效能優化',
    tags: ['react', 'performance'],
    note_type: 'learning',
    created_at: '2026-02-14T10:00:00Z',
  },
  {
    id: '3',
    title: '工作決策',
    tags: ['career'],
    note_type: 'decision',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: '4',
    title: 'React Router',
    tags: ['react', 'router'],
    note_type: 'thought',
    created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: '5',
    title: 'Python 基礎',
    tags: ['python'],
    note_type: 'learning',
    created_at: '2026-02-10T10:00:00Z',
  },
]

describe('findRelatedNotes', () => {
  it('prefers pre-computed related field from index.json', () => {
    const noteWithRelated = { ...notes[0], related: ['2', '4'] }
    const result = findRelatedNotes(noteWithRelated, notes, 5)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('4')
  })

  it('falls back to scoring when no pre-computed related', () => {
    const current = notes[0]
    const result = findRelatedNotes(current, notes, 3)
    expect(result.length).toBeLessThanOrEqual(3)
    expect(result.every((r) => r.id !== '1')).toBe(true)
  })

  it('prioritizes tag overlap in fallback', () => {
    const current = notes[0]
    const result = findRelatedNotes(current, notes, 5)
    const reactIds = result.filter((r) => (r.tags || []).includes('react')).map((r) => r.id)
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
