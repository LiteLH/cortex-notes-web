import { HashRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import { Layout } from './components/Layout.jsx'
import { AuthScreen } from './components/AuthScreen.jsx'
import { Home } from './components/Home.jsx'
import { NoteViewer } from './components/NoteViewer.jsx'
import { NoteEditor } from './components/NoteEditor.jsx'
import { CategoryBrowser } from './components/CategoryBrowser.jsx'
import { Loader2 } from 'lucide-react'

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<CategoryBrowser />} />
          <Route path="/browse/:category" element={<CategoryBrowser />} />
          <Route path="/browse/:category/:subcategory" element={<CategoryBrowser />} />
          <Route path="/note/:id" element={<NoteViewer />} />
          <Route path="/new" element={<NoteEditor />} />
          <Route path="/edit/:id" element={<NoteEditor />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
