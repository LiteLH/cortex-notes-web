import { useState, useMemo } from 'react'

export function extractTags(notes) {
  const counts = {}
  for (const note of notes) {
    for (const tag of note.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
}

export function filterByTags(notes, selectedTags) {
  if (!selectedTags.length) return notes
  return notes.filter((note) => selectedTags.some((tag) => (note.tags || []).includes(tag)))
}

const DEFAULT_VISIBLE = 10
const MOBILE_VISIBLE = 6

export function TagFilter({ notes, selectedTags, onToggle }) {
  const tags = useMemo(() => extractTags(notes), [notes])
  const [expanded, setExpanded] = useState(false)

  if (tags.length === 0) return null

  // Show fewer tags by default; always show selected tags
  const visibleCount = expanded ? tags.length : DEFAULT_VISIBLE
  const visibleTags = tags.slice(0, visibleCount)
  // Ensure selected tags are always visible even if beyond the limit
  const selectedBeyondVisible = expanded
    ? []
    : tags.slice(visibleCount).filter(({ tag }) => selectedTags.includes(tag))
  const allVisible = [...visibleTags, ...selectedBeyondVisible]
  const hiddenCount = tags.length - allVisible.length

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allVisible.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              aria-pressed={isSelected}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                isSelected
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {tag}
              <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          )
        })}
        {hiddenCount > 0 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="px-3 py-1 text-sm rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            +{hiddenCount} 更多
          </button>
        )}
        {expanded && tags.length > DEFAULT_VISIBLE && (
          <button
            onClick={() => setExpanded(false)}
            className="px-3 py-1 text-sm rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            收起
          </button>
        )}
      </div>
    </div>
  )
}
