import { describe, it, expect } from 'vitest'

function isPathSafe(path) {
  if (!path) return false
  if (path.includes('..')) return false
  if (path.startsWith('/')) return false
  return true
}

describe('path validation', () => {
  it('rejects path traversal', () => {
    expect(isPathSafe('../etc/passwd')).toBe(false)
    expect(isPathSafe('notes/../../secrets')).toBe(false)
  })

  it('rejects absolute paths', () => {
    expect(isPathSafe('/etc/passwd')).toBe(false)
  })

  it('accepts valid paths', () => {
    expect(isPathSafe('notes/2026-02-15-summary.md')).toBe(true)
    expect(isPathSafe('content/2026/my-note.md')).toBe(true)
    expect(isPathSafe('reports/analysis.html')).toBe(true)
  })

  it('rejects empty/null paths', () => {
    expect(isPathSafe('')).toBe(false)
    expect(isPathSafe(null)).toBe(false)
  })
})
