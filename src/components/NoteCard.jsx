import { Globe } from 'lucide-react'
import { formatDateSmart } from '../lib/date.js'
import { stripMarkdown } from '../lib/markdown.js'

const MAX_TAGS = 3
const MAX_EXCERPT = 120

const TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
}

const formatDate = formatDateSmart

export function NoteCard({ note, onClick }) {
  const manualTags = note.tags || []
  const aiTags = (note.ai_tags || []).filter(t => !manualTags.includes(t))
  const allTags = [...manualTags, ...aiTags]
  const displayTags = allTags.slice(0, MAX_TAGS)
  const overflowCount = allTags.length - MAX_TAGS
  const isHtml = note.format === 'html'
  const manualTagSet = new Set(manualTags)

  const excerpt = stripMarkdown(note.excerpt).slice(0, MAX_EXCERPT)

  return (
    <button
      onClick={() => onClick?.(note)}
      className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all min-h-[88px] flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isHtml ? (
            <span className="shrink-0 px-1.5 py-0.5 text-xs font-medium rounded text-purple-600 bg-purple-50">報告</span>
          ) : TYPE_BADGE[note.note_type] ? (
            <span className={`shrink-0 px-1.5 py-0.5 text-xs font-medium rounded ${TYPE_BADGE[note.note_type].color}`}>
              {TYPE_BADGE[note.note_type].label}
            </span>
          ) : null}
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
            {note.title || '無標題'}
          </h3>
        </div>
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
            <span key={tag} className={`px-2 py-0.5 text-xs rounded-full ${
              manualTagSet.has(tag)
                ? 'bg-gray-100 text-gray-600'
                : 'bg-violet-50 text-violet-500 border border-violet-200'
            }`}>
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
