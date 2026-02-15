import { useState, useMemo } from 'react'

const NOTE_TYPE_LABELS = {
  decision: '決策',
  learning: '學習',
  thought: '想法',
  meeting: '會議',
  memo: '備忘',
  report: '報告',
}

const TIME_RANGES = [
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '3 個月' },
  { value: 'all', label: '全部' },
]

export function extractFacets(notes) {
  const typeCounts = {}
  const tagCounts = {}

  for (const note of notes) {
    // Type facet
    const type = note.format === 'html' ? 'report' : (note.note_type || null)
    if (type) {
      typeCounts[type] = (typeCounts[type] || 0) + 1
    }
    // Tag facet (merge manual tags + AI tags)
    const allTags = new Set([...(note.tags || []), ...(note.ai_tags || [])])
    for (const tag of allTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }

  return {
    types: Object.entries(typeCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    tags: Object.entries(tagCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  }
}

function isInTimeRange(dateStr, range) {
  if (!range || range === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now - date) / 86400000

  switch (range) {
    case 'week': return diffDays <= 7
    case 'month': return diffDays <= 30
    case 'quarter': return diffDays <= 90
    default: return true
  }
}

export function applyFacets(notes, facets) {
  if (!facets || Object.keys(facets).length === 0) return notes

  return notes.filter(note => {
    // Type filter (OR within dimension)
    if (facets.types?.length) {
      const noteType = note.format === 'html' ? 'report' : (note.note_type || null)
      if (!facets.types.includes(noteType)) return false
    }

    // Tag filter (OR within dimension, matches both manual and AI tags)
    if (facets.tags?.length) {
      const noteTags = [...(note.tags || []), ...(note.ai_tags || [])]
      if (!facets.tags.some(t => noteTags.includes(t))) return false
    }

    // Time range filter
    if (facets.timeRange && facets.timeRange !== 'all') {
      if (!note.created_at || !isInTimeRange(note.created_at, facets.timeRange)) return false
    }

    return true
  })
}

export function FacetedFilter({ notes, facets, onFacetsChange }) {
  const [expanded, setExpanded] = useState(false)
  const extracted = useMemo(() => extractFacets(notes), [notes])

  const toggleType = (type) => {
    const current = facets.types || []
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    onFacetsChange({ ...facets, types: next })
  }

  const toggleTag = (tag) => {
    const current = facets.tags || []
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    onFacetsChange({ ...facets, tags: next })
  }

  const setTimeRange = (range) => {
    onFacetsChange({ ...facets, timeRange: facets.timeRange === range ? null : range })
  }

  return (
    <div className="space-y-3">
      {/* Type Filter Row */}
      {extracted.types.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="篩選條件">
          {extracted.types.map(({ value, count }) => {
            const isSelected = (facets.types || []).includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleType(value)}
                aria-pressed={isSelected}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {NOTE_TYPE_LABELS[value] || value}
                <span className="ml-1 text-xs opacity-70">{count}</span>
              </button>
            )
          })}

          {/* Time Range Buttons */}
          <span className="text-gray-300 self-center">|</span>
          {TIME_RANGES.map(({ value, label }) => {
            const isSelected = facets.timeRange === value
            return (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                aria-pressed={isSelected}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tag Filter Row */}
      {extracted.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extracted.tags.slice(0, expanded ? undefined : 10).map(({ value, count }) => {
            const isSelected = (facets.tags || []).includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleTag(value)}
                aria-pressed={isSelected}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {value}
                <span className="ml-1 text-xs opacity-70">{count}</span>
              </button>
            )
          })}
          {extracted.tags.length > 10 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 text-sm rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 transition-colors"
            >
              {expanded ? '收起' : `+${extracted.tags.length - 10} 更多`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
