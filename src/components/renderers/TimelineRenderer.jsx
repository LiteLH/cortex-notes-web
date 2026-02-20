import { useMemo } from 'react'
import { parseISO, isValid, isToday, isYesterday, isThisWeek, format } from 'date-fns'
import { Star } from 'lucide-react'
import { stripMarkdown } from '../../lib/markdown.js'

const TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
  'design-doc': { label: '設計', color: 'text-indigo-600 bg-indigo-50' },
  report: { label: '報告', color: 'text-purple-600 bg-purple-50' },
}

function TimelineCard({ note, onClick, isPinned }) {
  const isHtml = note.format === 'html'
  const badge = isHtml ? TYPE_BADGE.report : TYPE_BADGE[note.note_type] || null
  const safeDate = note.created_at ? new Date(note.created_at) : new Date()
  // Pure date strings (YYYY-MM-DD, 10 chars) have no real time info — don't show fake "08:00"
  const hasTime = note.created_at && note.created_at.length > 10
  const timeStr = hasTime && isValid(safeDate) ? format(safeDate, 'HH:mm') : ''
  const safeTags = [...(note.tags || []), ...(note.ai_tags || [])].slice(0, 3)

  return (
    <div
      onClick={onClick}
      className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          {isPinned && <Star size={12} className="text-amber-500" fill="currentColor" />}
          {badge && (
            <span className={`${badge.color} p-1 rounded text-xs font-bold`}>{badge.label}</span>
          )}
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {note.title || '無標題'}
          </h3>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">{timeStr}</span>
      </div>
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
        {stripMarkdown(note.excerpt) || '尚無預覽內容...'}
      </p>
      {safeTags.length > 0 && (
        <div className="flex items-center gap-2">
          {safeTags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function TimelineRenderer({ notes, onNoteClick, emptyMessage, pinnedIds }) {
  const timeline = useMemo(() => {
    if (!notes?.length) return {}
    const groups = { 今天: [], 昨天: [], 本週: [], 更早: [] }
    for (const note of notes) {
      try {
        const date = parseISO(note.created_at || '')
        if (!isValid(date)) {
          groups['更早'].push(note)
          continue
        }
        if (isToday(date)) groups['今天'].push(note)
        else if (isYesterday(date)) groups['昨天'].push(note)
        else if (isThisWeek(date, { weekStartsOn: 1 })) groups['本週'].push(note)
        else groups['更早'].push(note)
      } catch {
        groups['更早'].push(note)
      }
    }
    return groups
  }, [notes])

  if (!notes?.length) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage || '沒有筆記'}</div>
  }

  return (
    <div className="space-y-8">
      {Object.entries(timeline).map(
        ([label, group]) =>
          group.length > 0 && (
            <div key={label}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
                {label}
              </h2>
              <div className="space-y-3">
                {group.map((note) => (
                  <TimelineCard
                    key={note.id}
                    note={note}
                    onClick={() => onNoteClick?.(note)}
                    isPinned={pinnedIds?.has(note.id)}
                  />
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  )
}
