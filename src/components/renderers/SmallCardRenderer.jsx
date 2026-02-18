import { formatDateSmart } from '../../lib/date.js'

const TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
  'design-doc': { label: '設計', color: 'text-violet-600 bg-violet-50' },
  report: { label: '報告', color: 'text-purple-600 bg-purple-50' },
}

const formatDate = formatDateSmart

export function SmallCardRenderer({ notes, onNoteClick, emptyMessage }) {
  if (!notes?.length) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage || '沒有筆記'}</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {notes.map(note => {
        const noteType = note.format === 'html' ? 'report' : note.note_type
        const badge = TYPE_BADGE[noteType]
        const tags = [...(note.tags || []), ...(note.ai_tags || [])].slice(0, 2)

        return (
          <button
            key={note.id}
            onClick={() => onNoteClick?.(note)}
            className="text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col gap-1.5 min-h-[72px]"
          >
            <div className="flex items-center gap-1">
              {badge && (
                <span className={`shrink-0 px-1 py-0.5 text-[10px] font-medium rounded ${badge.color}`}>
                  {badge.label}
                </span>
              )}
              <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
              {note.title || '無標題'}
            </h3>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-auto">
                {tags.map(tag => (
                  <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
