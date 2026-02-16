import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { searchNotes } from '../lib/search.js'
import { useNotes } from '../contexts/NotesContext.jsx'

export function SearchBar({ onResults, onClear }) {
  const { notes, isLoading, searchIndex } = useNotes()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounced search
  const handleSearch = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (!q.trim()) {
        onClear?.()
        return
      }
      if (!searchIndex) return
      const hits = searchNotes(searchIndex, q)
      // Map search results back to full note objects
      const hitIds = new Set(hits.map(h => h.id))
      const results = notes.filter(n => hitIds.has(n.id))
      // Sort by search score
      const scoreMap = Object.fromEntries(hits.map(h => [h.id, h.score]))
      results.sort((a, b) => (scoreMap[b.id] || 0) - (scoreMap[a.id] || 0))
      onResults?.(results, q)
    }, 150)
  }, [searchIndex, notes, onResults, onClear])

  useEffect(() => {
    handleSearch(query)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, handleSearch])

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('')
        inputRef.current?.blur()
        onClear?.()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClear])

  const indexReady = !!searchIndex
  const placeholder = isLoading
    ? '索引載入中...'
    : indexReady
      ? '搜尋筆記、標籤、內容... (\u2318K)'
      : '搜尋筆記...'

  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); onClear?.() }}
          aria-label="清除搜尋"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
