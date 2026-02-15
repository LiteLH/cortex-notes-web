import { NoteCard } from './NoteCard.jsx'

export function CardGrid({ notes, onNoteClick, emptyMessage }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {emptyMessage || '沒有筆記'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={onNoteClick}
        />
      ))}
    </div>
  )
}
