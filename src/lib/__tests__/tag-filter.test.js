import { describe, it, expect } from 'vitest'

function extractTags(notes) {
  const counts = {}
  for (const note of notes) {
    for (const tag of note.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
}

function filterByTags(notes, selectedTags) {
  if (!selectedTags.length) return notes
  return notes.filter((note) => selectedTags.some((tag) => (note.tags || []).includes(tag)))
}

describe('tag extraction', () => {
  it('counts tags across notes', () => {
    const notes = [{ tags: ['dev', 'ai'] }, { tags: ['dev'] }, { tags: ['ai', 'report'] }]
    const result = extractTags(notes)
    expect(result[0]).toEqual({ tag: 'dev', count: 2 })
    expect(result[1]).toEqual({ tag: 'ai', count: 2 })
    expect(result[2]).toEqual({ tag: 'report', count: 1 })
  })
})

describe('tag filtering (OR logic)', () => {
  it('returns all when no tags selected', () => {
    const notes = [{ tags: ['a'] }, { tags: ['b'] }]
    expect(filterByTags(notes, [])).toHaveLength(2)
  })

  it('filters with OR logic', () => {
    const notes = [
      { id: 1, tags: ['a'] },
      { id: 2, tags: ['b'] },
      { id: 3, tags: ['c'] },
    ]
    const result = filterByTags(notes, ['a', 'b'])
    expect(result).toHaveLength(2)
  })
})
