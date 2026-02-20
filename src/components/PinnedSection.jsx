import { useNavigate } from 'react-router-dom'
import { Star, FileText } from 'lucide-react'
import { usePinnedNotes } from '../hooks/usePinnedNotes.js'

export function PinnedSection({ variant = 'sidebar' }) {
  const navigate = useNavigate()
  const { pinnedNotes } = usePinnedNotes()

  if (pinnedNotes.length === 0) return null

  if (variant === 'sidebar') {
    return (
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
          <Star size={12} className="text-amber-500" />
          已釘選
        </div>
        <div className="space-y-0.5">
          {pinnedNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => navigate(`/note/${note.id}`)}
              className="group w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 rounded-md cursor-pointer transition-colors text-left"
            >
              <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />
              <span className="truncate">{note.title || '無標題'}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // variant === 'home' — for mobile home page
  return (
    <div className="mb-6 bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
        <Star size={16} fill="currentColor" />
        我的收藏（{pinnedNotes.length}）
      </h2>
      <div className="space-y-1.5">
        {pinnedNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => navigate(`/note/${note.id}`)}
            className="w-full flex items-center gap-2 p-2.5 bg-white rounded-lg hover:bg-amber-50 border border-amber-100 transition-colors text-left"
          >
            <FileText size={14} className="text-amber-500 shrink-0" />
            <span className="text-sm text-gray-800 truncate">{note.title || '無標題'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
