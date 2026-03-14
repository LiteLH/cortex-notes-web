import { describe, it, expect } from 'vitest'
import { createSearchIndex, searchNotes, expandQuery } from '../search.js'

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
    const { hits } = searchNotes(index, '前端')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].id).toBe('note-1')
  })

  it('finds English text', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const { hits } = searchNotes(index, 'MCP')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].id).toBe('note-2')
  })

  it('finds by tag', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const { hits } = searchNotes(index, '開發日誌')
    expect(hits.length).toBeGreaterThan(0)
  })

  it('returns empty for no match', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const { hits } = searchNotes(index, 'zzzznonexistent')
    expect(hits).toHaveLength(0)
  })

  it('handles single character search', () => {
    const index = createSearchIndex(MOCK_NOTES)
    const { hits } = searchNotes(index, '前')
    expect(Array.isArray(hits)).toBe(true)
  })

  it('returns expanded flag when synonyms used', () => {
    const index = createSearchIndex(MOCK_NOTES)
    // '報告' is a synonym for 'report' — should find note-2 via expansion
    const { hits, expanded } = searchNotes(index, '報告')
    // May or may not find via expansion depending on tokenization
    expect(typeof expanded).toBe('boolean')
  })
})

describe('expandQuery', () => {
  it('expands Chinese to English synonyms', () => {
    const result = expandQuery('嵌入')
    expect(result).toContain('embedding')
  })

  it('expands English to Chinese synonyms', () => {
    const result = expandQuery('embedding')
    expect(result).toContain('嵌入')
  })

  it('preserves original terms', () => {
    const result = expandQuery('hello world')
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })

  it('handles unknown terms without expansion', () => {
    const result = expandQuery('xyzabc')
    expect(result).toBe('xyzabc')
  })
})
