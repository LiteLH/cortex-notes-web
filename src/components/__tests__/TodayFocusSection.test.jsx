import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayFocusSection } from '../TodayFocusSection.jsx'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TodayFocusSection', () => {
  it('shows empty state when no rediscovery notes available', () => {
    renderWithRouter(<TodayFocusSection notes={[]} onNoteClick={() => {}} />)
    expect(screen.getByText(/目前沒有可推薦的舊筆記/)).toBeDefined()
  })

  it('does NOT show review section even if notes have next_review', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const notes = [{ id: '1', title: '重要決策', next_review: today, created_at: '2026-01-01' }]
    renderWithRouter(<TodayFocusSection notes={notes} onNoteClick={() => {}} />)
    // Should show rediscovery (note is old enough) but NOT the review header
    expect(screen.queryByText(/待回顧/)).toBeNull()
  })

  it('shows rediscovery notes for old notes', () => {
    const oldDate = '2025-01-01'
    const notes = [
      { id: '1', title: '舊筆記一', created_at: oldDate, note_type: 'thought' },
      { id: '2', title: '舊筆記二', created_at: oldDate, note_type: 'learning' },
      { id: '3', title: '舊筆記三', created_at: oldDate, note_type: 'decision' },
    ]
    renderWithRouter(<TodayFocusSection notes={notes} onNoteClick={() => {}} />)
    expect(screen.getByText(/回憶角落/)).toBeDefined()
  })
})
