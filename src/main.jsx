import { Buffer } from 'buffer'
// Polyfill Buffer for browser environment (essential for gray-matter)
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { NotesProvider } from './contexts/NotesContext.jsx'
import { UserStateProvider } from './contexts/UserStateContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NotesProvider>
          <UserStateProvider>
            <App />
          </UserStateProvider>
        </NotesProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
