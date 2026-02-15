import { createContext, useContext, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useAuth } from './AuthContext.jsx'

const NotesContext = createContext(null)

export function NotesProvider({ children }) {
  const { service, token, isAuthenticated } = useAuth()

  // Cache key includes token suffix for isolation
  const cacheKey = isAuthenticated && service ? `notes-${token.slice(-6)}` : null

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    async () => {
      const raw = await service.getNotesIndex()
      // Support new { _stats, notes } format and legacy array format
      const index = Array.isArray(raw) ? raw : (raw?.notes || [])
      const stats = Array.isArray(raw) ? null : { ...(raw?._stats || {}), _tag_clusters: raw?._tag_clusters || [] }
      const notes = (index || [])
        .map(n => ({ ...n, created_at: n.created_at || new Date().toISOString() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return { notes, stats }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 min dedup
    }
  )

  const refreshNotes = useCallback(() => mutate(), [mutate])

  // Optimistic update: add/update a note in local cache
  const optimisticUpdate = useCallback((noteData) => {
    mutate(current => {
      const notes = current?.notes || []
      const idx = notes.findIndex(n => n.id === noteData.id)
      const updatedNotes = idx >= 0
        ? notes.map((n, i) => i === idx ? { ...n, ...noteData } : n)
        : [noteData, ...notes]
      return { ...current, notes: updatedNotes }
    }, { revalidate: false })
  }, [mutate])

  // Optimistic delete: remove a note from local cache
  const optimisticDelete = useCallback((noteId) => {
    mutate(current => {
      const notes = (current?.notes || []).filter(n => n.id !== noteId)
      return { ...current, notes }
    }, { revalidate: false })
  }, [mutate])

  const value = useMemo(() => ({
    notes: data?.notes || [],
    stats: data?.stats || null,
    isLoading,
    error,
    refreshNotes,
    optimisticUpdate,
    optimisticDelete,
  }), [data, isLoading, error, refreshNotes, optimisticUpdate, optimisticDelete])

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotes must be used within NotesProvider')
  return context
}
