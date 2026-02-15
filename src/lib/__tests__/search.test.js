import { describe, it, expect } from 'vitest'
import { createSearchIndex, searchNotes } from '../search.js'

const MOCK_NOTES = [
  {
    id: 'note-1',
    title: '2026-02-14 開發摘要',
    tags: ['開發日誌'],
    searchable_text: 'Cortex Notes 前端重構完成，修復了 Markdown 渲染問題',
    excerpt: 'Cortex Notes 前端重構完成...',
    path: 'notes/2026-02-14-summary.md',
  },
  {
    id: 'note-2',
    title: 'MCP Strategy Report',
    tags: ['report', 'AI'],
    searchable_text: 'Model Context Protocol strategy analysis for personal knowledge management',
    excerpt: 'MCP strategy analysis...',
    path: 'reports/mcp_strategy.html',
    format: 'html',
  },
  {
    id: 'note-3',
    title: 'Vite 設定筆記',
    tags: ['技術決策'],
    searchable_text: '使用 Vite 7 作為建構工具，設定 React plugin 和 Tailwind CSS',
    excerpt: '使用 Vite 7...',
    path: 'content/2026/vite-config.md',
  },
]

describe('createSearchIndex', () => {
  it('creates index from notes array', () => {
    const index = createSearchIndex(MOCK_NOTES)
    expect(index).toBeDefined()
    expect(index.documentCount).toBe(3)
  })
})

describe('searchNotes', () => {
  it('finds Chinese text', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const results = searchNotes(index, '前端')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('note-1')
  })

  it('finds English text', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const results = searchNotes(index, 'MCP')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('note-2')
  })

  it('finds by tag', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const results = searchNotes(index, '開發日誌')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns empty for no match', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const results = searchNotes(index, 'zzzznonexistent')
    expect(results).toHaveLength(0)
  })

  it('handles single character search', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const results = searchNotes(index, '前')
    // Should not crash, may or may not find results
    expect(Array.isArray(results)).toBe(true)
  })
})
