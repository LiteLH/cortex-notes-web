import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { GitHubService } from '../lib/github.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || '')
  const [service, setService] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    const svc = new GitHubService(token)
    svc.verifyToken().then(result => {
      if (result.valid) {
        setService(svc)
        setIsAuthenticated(true)
        setAuthError(null)
      } else {
        setAuthError(result.error)
        localStorage.removeItem('gh_token')
        setToken('')
      }
    }).catch(err => {
      setAuthError(err.message)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [token])

  const login = useCallback((newToken) => {
    if (!newToken.trim()) {
      setAuthError('Token 不能為空')
      return
    }
    localStorage.setItem('gh_token', newToken)
    setToken(newToken)
    setIsLoading(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gh_token')
    setToken('')
    setService(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ token, service, isAuthenticated, isLoading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
