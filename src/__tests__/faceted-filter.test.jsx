import { describe, it, expect } from 'vitest'
import { applyFacets, extractFacets } from '../components/FacetedFilter.jsx'

const mockNotes = [
  {
    id: '1',
    note_type: 'decision',
    tags: ['arch'],
    created_at: '2026-02-15T10:00:00Z',
    decision_status: 'active',
  },
  { id: '2', note_type: 'learning', tags: ['react'], created_at: '2026-02-10T10:00:00Z' },
  { id: '3', note_type: 'thought', tags: ['arch', 'react'], created_at: '2026-01-01T10:00:00Z' },
  { id: '4', note_type: 'meeting', tags: ['team'], created_at: '2025-06-01T10:00:00Z' },
  { id: '5', tags: ['misc'], created_at: '2026-02-14T10:00:00Z', format: 'html' },
  { id: '6', note_type: 'design-doc', tags: ['architecture'], created_at: '2026-02-18T10:00:00Z' },
]

describe('extractFacets', () => {
  it('extracts note types with counts', () => {
    const facets = extractFacets(mockNotes)
    expect(facets.types).toContainEqual({ value: 'decision', count: 1 })
    expect(facets.types).toContainEqual({ value: 'learning', count: 1 })
  })

  it('extracts tags with counts', () => {
    const facets = extractFacets(mockNotes)
    expect(facets.tags.find((t) => t.value === 'arch').count).toBe(2)
  })

  it('includes report type for html format notes', () => {
    const facets = extractFacets(mockNotes)
    expect(facets.types.find((t) => t.value === 'report')).toBeDefined()
  })

  it('includes design-doc type', () => {
    const facets = extractFacets(mockNotes)
    expect(facets.types).toContainEqual({ value: 'design-doc', count: 1 })
  })

  it('merges ai_tags into tag facets', () => {
    const notesWithAiTags = [
      ...mockNotes,
      {
        id: '7',
        note_type: 'learning',
        tags: ['react'],
        ai_tags: ['前端', 'hooks'],
        created_at: '2026-02-15T10:00:00Z',
      },
    ]
    const facets = extractFacets(notesWithAiTags)
    expect(facets.tags.find((t) => t.value === '前端')).toBeDefined()
    expect(facets.tags.find((t) => t.value === 'hooks')).toBeDefined()
    // react appears in notes 2, 3, and 7 (3 notes total)
    expect(facets.tags.find((t) => t.value === 'react').count).toBe(3)
  })
})

describe('applyFacets', () => {
  it('returns all notes when no facets selected', () => {
    expect(applyFacets(mockNotes, {}).length).toBe(6)
  })

  it('filters by note type', () => {
    const result = applyFacets(mockNotes, { types: ['decision'] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by multiple types (OR within dimension)', () => {
    const result = applyFacets(mockNotes, { types: ['decision', 'learning'] })
    expect(result.length).toBe(2)
  })

  it('filters by tags', () => {
    const result = applyFacets(mockNotes, { tags: ['arch'] })
    expect(result.length).toBe(2)
  })

  it('filters by type AND tags (AND across dimensions)', () => {
    const result = applyFacets(mockNotes, { types: ['thought'], tags: ['arch'] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('3')
  })

  it('filters by time range', () => {
    const result = applyFacets(mockNotes, { timeRange: 'month' })
    // 只有 2026-02 的筆記
    expect(result.every((n) => n.created_at.startsWith('2026-02'))).toBe(true)
  })

  it('filters report type by format=html', () => {
    const result = applyFacets(mockNotes, { types: ['report'] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('5')
  })

  it('matches ai_tags when filtering by tags', () => {
    const notesWithAiTags = [
      { id: '1', tags: ['react'], ai_tags: ['前端'], created_at: '2026-02-15T10:00:00Z' },
      { id: '2', tags: ['python'], created_at: '2026-02-15T10:00:00Z' },
    ]
    const result = applyFacets(notesWithAiTags, { tags: ['前端'] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })
})
