import { useMemo } from 'react'
import { Clock, ArrowRight } from 'lucide-react'

export function getDueForReview(notes) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return notes
    .filter((n) => n.next_review && n.next_review <= today)
    .sort((a, b) => a.next_review.localeCompare(b.next_review))
}

export function ReviewSection({ notes, onNoteClick }) {
  const dueNotes = useMemo(() => getDueForReview(notes), [notes])

  if (dueNotes.length === 0) return null

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
        <Clock size={16} />
        今日回顧（{dueNotes.length} 筆待回顧）
      </h2>
      <div className="space-y-2">
        {dueNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => onNoteClick(note)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-50 border border-amber-100 transition-colors text-left"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{note.title}</div>
              <div className="text-xs text-amber-600">
                {note.decision_category && `${note.decision_category} · `}
                回顧日期：{note.next_review}
              </div>
            </div>
            <ArrowRight size={14} className="text-amber-400 shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  )
}
