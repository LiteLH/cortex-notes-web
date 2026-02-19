import { Star } from 'lucide-react'
import { usePinnedNotes } from '../hooks/usePinnedNotes.js'

export function PinButton({ noteId }) {
  const { togglePin, isPinned } = usePinnedNotes()
  const pinned = isPinned(noteId)

  return (
    <button
      onClick={() => togglePin(noteId)}
      aria-label={pinned ? '取消收藏' : '加入收藏'}
      aria-pressed={pinned}
      className={`p-2 rounded-lg transition-colors ${
        pinned
          ? 'text-amber-500 hover:bg-amber-50'
          : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
      }`}
    >
      <Star size={18} fill={pinned ? 'currentColor' : 'none'} />
    </button>
  )
}
