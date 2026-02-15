import { Globe } from 'lucide-react'

const MAX_TAGS = 3
const MAX_EXCERPT = 120

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function NoteCard({ note, onClick }) {
  const tags = note.tags || []
  const displayTags = tags.slice(0, MAX_TAGS)
  const overflowCount = tags.length - MAX_TAGS
  const isHtml = note.format === 'html'

  const excerpt = (note.excerpt || '').slice(0, MAX_EXCERPT)

  return (
    <button
      onClick={() => onClick?.(note)}
      className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all min-h-[88px] flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
          {isHtml && <Globe size={14} className="inline mr-1 text-blue-500" />}
          {note.title || '無標題'}
        </h3>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
          {formatDate(note.created_at)}
        </span>
      </div>

      {excerpt && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
          {excerpt}
        </p>
      )}

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {displayTags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-400">
              +{overflowCount}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
