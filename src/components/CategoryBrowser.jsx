import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, FileText } from 'lucide-react'
import { useNotes } from '../contexts/NotesContext.jsx'
import { TreeView } from './TreeView.jsx'
import { TagClusterView } from './TagClusterView.jsx'

export function getCategoryFromPath(path) {
  if (!path) return { category: 'content', subcategory: null }
  const parts = path.split('/')
  const category = parts[0]
  const subcategory = parts.length > 2 ? parts[1] : null
  return { category, subcategory }
}

export function CategoryBrowser() {
  const navigate = useNavigate()
  const { notes, stats } = useNotes()
  const safeNotes = Array.isArray(notes) ? notes : []
  const [viewMode, setViewMode] = useState('tree') // 'tree' | 'tags'

  // Read tag_clusters from stats context (passed via index.json)
  const tagClusters = stats?._tag_clusters || []

  const handleNoteClick = (note) => navigate(`/note/${note.id}`)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📂 分類瀏覽</h1>
        <p className="text-gray-500 text-sm">{safeNotes.length} 個筆記</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('tree')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            viewMode === 'tree'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
          }`}
        >
          <FolderOpen size={14} />
          樹狀結構
        </button>
        <button
          onClick={() => setViewMode('tags')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            viewMode === 'tags'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
          }`}
        >
          <FileText size={14} />
          標籤分群
        </button>
      </div>

      {/* Content */}
      {viewMode === 'tree' ? (
        <TreeView notes={safeNotes} onNoteClick={handleNoteClick} />
      ) : (
        <TagClusterView clusters={tagClusters} notes={safeNotes} onNoteClick={handleNoteClick} />
      )}
    </div>
  )
}

// 側邊欄分類導航組件 (preserved for Layout.jsx)
export function CategoryNav({ notes, onNavigate }) {
  const safeNotes = Array.isArray(notes) ? notes : []

  const counts = useMemo(() => {
    const result = {}
    safeNotes.forEach((note) => {
      const { category } = getCategoryFromPath(note.path)
      result[category] = (result[category] || 0) + 1
    })
    return result
  }, [safeNotes])

  const CATEGORIES = {
    notes: { label: '📝 筆記' },
    reports: { label: '📊 報告' },
    areas: { label: '📁 領域' },
    content: { label: '📦 舊內容' },
  }

  return (
    <div className="space-y-1">
      {Object.entries(CATEGORIES).map(([key, catInfo]) => {
        const count = counts[key] || 0
        if (count === 0) return null
        return (
          <button
            key={key}
            onClick={() => onNavigate(`/browse/${key}`)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
          >
            <span>{catInfo.label}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

export default CategoryBrowser
