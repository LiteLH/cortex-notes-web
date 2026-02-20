import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext.jsx'

// Mock localStorage
const mockStorage = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, val) => {
    mockStorage[key] = val
  }),
  removeItem: vi.fn((key) => {
    delete mockStorage[key]
  }),
})

describe('useAuth', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.service).toBeNull()
  })

  it('logout clears token', () => {
    mockStorage.gh_token = 'test-token'
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('gh_token')
  })
})
