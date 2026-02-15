import { createContext, useContext, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useAuth } from './AuthContext.jsx'

const NotesContext = createContext(null)

export function NotesProvider({ children }) {
  const { service, token, isAuthenticated } = useAuth()

  // Cache key includes token suffix for isolation
  const cacheKey = isAuthenticated && service ? `notes-${token.slice(-6)}` : null

  const { data: notes, error, isLoading, mutate } = useSWR(
    cacheKey,
    async () => {
      const index = await service.getNotesIndex()
      // Sort by created_at descending, with date validation
      return (index || [])
        .map(n => ({ ...n, created_at: n.created_at || new Date().toISOString() }))
        .sort((a, b) => {
          const da = new Date(a.created_at)
          const db = new Date(b.created_at)
          return db - da
        })
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
      if (!current) return [noteData]
      const idx = current.findIndex(n => n.id === noteData.id)
      if (idx >= 0) {
        const updated = [...current]
        updated[idx] = { ...current[idx], ...noteData }
        return updated
      }
      return [noteData, ...current]
    }, { revalidate: false })
  }, [mutate])

  // Optimistic delete: remove a note from local cache
  const optimisticDelete = useCallback((noteId) => {
    mutate(current => {
      if (!current) return []
      return current.filter(n => n.id !== noteId)
    }, { revalidate: false })
  }, [mutate])

  const value = useMemo(() => ({
    notes: notes || [],
    isLoading,
    error,
    refreshNotes,
    optimisticUpdate,
    optimisticDelete,
  }), [notes, isLoading, error, refreshNotes, optimisticUpdate, optimisticDelete])

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
