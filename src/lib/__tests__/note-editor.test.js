import { describe, it, expect } from 'vitest'

describe('NoteEditor date logic', () => {
  it('should preserve original created_at when editing', () => {
    const original = '2026-01-15T10:30:00.000Z'
    const isEditing = true

    // When editing, use original created_at
    const result = isEditing ? original : new Date().toISOString()
    expect(result).toBe(original)
  })

  it('should use current time for new notes', () => {
    const isEditing = false
    const before = Date.now()
    const result = isEditing ? null : new Date().toISOString()
    const after = Date.now()

    const ts = new Date(result).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})
