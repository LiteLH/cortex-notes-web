import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Star } from 'lucide-react'
import { formatDateSmart } from '../../lib/date.js'

const TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
  'design-doc': { label: '設計', color: 'text-indigo-600 bg-indigo-50' },
  report: { label: '報告', color: 'text-purple-600 bg-purple-50' },
}

const COLUMNS = [
  { key: 'title', label: '標題', className: 'flex-1 min-w-0' },
  { key: 'note_type', label: '類型', className: 'w-16 shrink-0 hidden sm:block' },
  { key: 'tags', label: '標籤', className: 'w-32 shrink-0 hidden md:block' },
  { key: 'created_at', label: '日期', className: 'w-20 shrink-0 text-right' },
]

function SortHeader({ column, sortKey, sortDir, onSort }) {
  const isActive = sortKey === column.key
  return (
    <button
      onClick={() => onSort(column.key)}
      className={`flex items-center gap-0.5 text-xs font-medium uppercase tracking-wider transition-colors ${
        isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      } ${column.className}`}
    >
      {column.label}
      {isActive && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
    </button>
  )
}

function compareFn(a, b, key, dir) {
  const mul = dir === 'asc' ? 1 : -1
  switch (key) {
    case 'title':
      return mul * (a.title || '').localeCompare(b.title || '', 'zh-TW')
    case 'note_type': {
      const ta = a.format === 'html' ? 'report' : a.note_type || 'zzz'
      const tb = b.format === 'html' ? 'report' : b.note_type || 'zzz'
      return mul * ta.localeCompare(tb)
    }
    case 'tags': {
      const ta = [...(a.tags || []), ...(a.ai_tags || [])].join(',')
      const tb = [...(b.tags || []), ...(b.ai_tags || [])].join(',')
      return mul * ta.localeCompare(tb, 'zh-TW')
    }
    case 'created_at': {
      const da = (a.created_at || '').slice(0, 10)
      const db = (b.created_at || '').slice(0, 10)
      const cmp = da.localeCompare(db)
      if (cmp !== 0) return mul * cmp
      return (a.title || '').localeCompare(b.title || '', 'zh-TW')
    }
    default:
      return 0
  }
}

export function SortableListRenderer({ notes, onNoteClick, emptyMessage, pinnedIds }) {
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    if (!notes?.length) return []
    return [...notes].sort((a, b) => compareFn(a, b, sortKey, sortDir))
  }, [notes, sortKey, sortDir])

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'title' ? 'asc' : 'desc')
    }
  }

  if (!notes?.length) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage || '沒有筆記'}</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200 mb-1">
        {COLUMNS.map((col) => (
          <SortHeader
            key={col.key}
            column={col}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-0.5" role="list">
        {sorted.map((note) => {
          const noteType = note.format === 'html' ? 'report' : note.note_type
          const badge = TYPE_BADGE[noteType]
          const tags = [...(note.tags || []), ...(note.ai_tags || [])].slice(0, 3)
          const dateStr = formatDateSmart(note.created_at)

          return (
            <button
              key={note.id}
              role="listitem"
              onClick={() => onNoteClick?.(note)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              {pinnedIds?.has(note.id) && (
                <Star size={12} className="shrink-0 text-amber-500" fill="currentColor" />
              )}
              <div className="flex-1 min-w-0 text-sm text-gray-800 truncate">
                {note.title || '無標題'}
                {note.format === 'html' && note.path?.match(/(\d{8})/)?.[1] && (
                  <span className="ml-2 text-[10px] text-gray-400 font-mono">
                    {note.path.match(/(\d{8})/)[1]}
                  </span>
                )}
              </div>
              <div className="w-16 shrink-0 hidden sm:block">
                {badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <div className="w-32 shrink-0 hidden md:flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="w-20 shrink-0 text-right text-xs text-gray-400">{dateStr}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
