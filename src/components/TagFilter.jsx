import { useMemo } from 'react'

export function extractTags(notes) {
  const counts = {}
  for (const note of notes) {
    for (const tag of (note.tags || [])) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
}

export function filterByTags(notes, selectedTags) {
  if (!selectedTags.length) return notes
  return notes.filter(note =>
    selectedTags.some(tag => (note.tags || []).includes(tag))
  )
}

export function TagFilter({ notes, selectedTags, onToggle }) {
  const tags = useMemo(() => extractTags(notes), [notes])

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
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
    </div>
  )
}
