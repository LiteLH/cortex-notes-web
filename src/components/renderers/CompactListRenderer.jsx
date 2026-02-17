import { formatDateSmart } from '../../lib/date.js'

const TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
  report: { label: '報告', color: 'text-purple-600 bg-purple-50' },
}

const formatDate = formatDateSmart

export function CompactListRenderer({ notes, onNoteClick, emptyMessage }) {
  if (!notes?.length) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage || '沒有筆記'}</div>
  }

  return (
    <div className="space-y-0.5" role="list">
      {notes.map(note => {
        const noteType = note.format === 'html' ? 'report' : note.note_type
        const badge = TYPE_BADGE[noteType]
        const tags = [...(note.tags || []), ...(note.ai_tags || [])].slice(0, 2)

        return (
          <button
            key={note.id}
            role="listitem"
            onClick={() => onNoteClick?.(note)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors group"
          >
            {badge && (
              <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.color}`}>
                {badge.label}
              </span>
            )}
            <span className="flex-1 text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">
              {note.title || '無標題'}
            </span>
            {tags.length > 0 && (
              <span className="hidden sm:flex items-center gap-1 shrink-0">
                {tags.map(tag => (
                  <span key={tag} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </span>
            )}
            <span className="text-xs text-gray-400 shrink-0">
              {formatDate(note.created_at)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
