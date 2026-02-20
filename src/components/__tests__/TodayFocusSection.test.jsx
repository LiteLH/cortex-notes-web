import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayFocusSection } from '../TodayFocusSection.jsx'

// Helper: wrap with router since component uses useNavigate
function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TodayFocusSection', () => {
  it('shows empty state message when no review or rediscovery notes', () => {
    renderWithRouter(<TodayFocusSection notes={[]} onNoteClick={() => {}} />)
    expect(screen.getByText(/目前沒有到期/)).toBeDefined()
  })

  it('shows review notes when next_review is due', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const notes = [{ id: '1', title: '重要決策', next_review: today, created_at: '2026-01-01' }]
    renderWithRouter(<TodayFocusSection notes={notes} onNoteClick={() => {}} />)
    expect(screen.getAllByText('重要決策').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/今日焦點/)).toBeDefined()
  })
})
