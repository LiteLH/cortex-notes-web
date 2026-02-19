import { createContext, useContext, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useAuth } from './AuthContext.jsx'

const UserStateContext = createContext(null)

export function UserStateProvider({ children }) {
  const { service, token, isAuthenticated } = useAuth()

  const cacheKey = isAuthenticated && service ? `user-state-${token.slice(-6)}` : null

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    async () => {
      const result = await service.getUserState()
      return result // { data, sha }
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const togglePin = useCallback(async (noteId) => {
    if (!service || !data) return

    const currentPins = data.data?.pins || []
    const isPinned = currentPins.some(p => p.noteId === noteId)

    let newPins
    if (isPinned) {
      newPins = currentPins.filter(p => p.noteId !== noteId)
    } else {
      newPins = [{ noteId, pinnedAt: new Date().toISOString() }, ...currentPins]
    }

    const newState = { ...data.data, pins: newPins }

    // Optimistic update
    mutate({ data: newState, sha: data.sha }, { revalidate: false })

    // Persist to GitHub
    try {
      const result = await service.saveUserState(newState, data.sha)
      // Update SHA after successful write
      mutate({ data: newState, sha: result.sha }, { revalidate: false })
    } catch (e) {
      // Revert on failure
      console.error('Failed to save user state:', e)
      mutate()
    }
  }, [service, data, mutate])

  const isPinned = useCallback((noteId) => {
    return (data?.data?.pins || []).some(p => p.noteId === noteId)
  }, [data])

  const value = useMemo(() => ({
    pins: data?.data?.pins || [],
    isLoading,
    error,
    togglePin,
    isPinned,
  }), [data, isLoading, error, togglePin, isPinned])

  return (
    <UserStateContext.Provider value={value}>
      {children}
    </UserStateContext.Provider>
  )
}

export function useUserState() {
  const context = useContext(UserStateContext)
  if (!context) throw new Error('useUserState must be used within UserStateProvider')
  return context
}
