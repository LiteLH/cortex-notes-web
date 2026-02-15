import { describe, it, expect } from 'vitest'
import { pickRediscovery, seededRandom } from '../components/RediscoverySection.jsx'

describe('seededRandom', () => {
  it('returns same value for same seed', () => {
    expect(seededRandom('2026-02-15')).toBe(seededRandom('2026-02-15'))
  })

  it('returns different values for different seeds', () => {
    expect(seededRandom('2026-02-15')).not.toBe(seededRandom('2026-02-16'))
  })

  it('returns value between 0 and 1', () => {
    const val = seededRandom('2026-02-15')
    expect(val).toBeGreaterThanOrEqual(0)
    expect(val).toBeLessThan(1)
  })
})

describe('pickRediscovery', () => {
  const oldNotes = Array.from({ length: 20 }, (_, i) => ({
    id: `old-${i}`,
    title: `Old note ${i}`,
    note_type: i < 5 ? 'decision' : 'thought',
    created_at: new Date(Date.now() - (60 + i) * 86400000).toISOString(),
  }))

  const recentNotes = Array.from({ length: 5 }, (_, i) => ({
    id: `new-${i}`,
    title: `New note ${i}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }))

  it('returns 1-2 notes from old notes only', () => {
    const result = pickRediscovery([...recentNotes, ...oldNotes], '2026-02-15')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.length).toBeLessThanOrEqual(2)
    expect(result.every(n => n.id.startsWith('old-'))).toBe(true)
  })

  it('returns same notes for same date', () => {
    const all = [...recentNotes, ...oldNotes]
    const r1 = pickRediscovery(all, '2026-02-15')
    const r2 = pickRediscovery(all, '2026-02-15')
    expect(r1.map(n => n.id)).toEqual(r2.map(n => n.id))
  })

  it('returns empty for no old notes', () => {
    expect(pickRediscovery(recentNotes, '2026-02-15').length).toBe(0)
  })
})
