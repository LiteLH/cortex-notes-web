import { useMemo } from 'react'
import { useUserState } from '../contexts/UserStateContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'

export function usePinnedNotes() {
  const { pins, togglePin, isPinned } = useUserState()
  const { notes } = useNotes()

  // Resolve pin IDs to full note objects, preserve pin order (newest first)
  const pinnedNotes = useMemo(() => {
    if (!pins.length || !notes.length) return []
    const noteMap = new Map(notes.map((n) => [n.id, n]))
    return pins.map((p) => noteMap.get(p.noteId)).filter(Boolean)
  }, [pins, notes])

  return { pinnedNotes, togglePin, isPinned }
}
