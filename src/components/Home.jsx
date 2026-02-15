import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../contexts/NotesContext.jsx'
import { SearchBar } from './SearchBar.jsx'
import { TagFilter, filterByTags } from './TagFilter.jsx'
import { CardGrid } from './CardGrid.jsx'
import { Book } from 'lucide-react'
import { parseISO, isValid, isToday, isYesterday, isThisWeek, format } from 'date-fns'

function TimelineCard({ note, onClick }) {
  const safeTags = Array.isArray(note.tags) ? note.tags : []
  const isReport = safeTags.some(t => ['report', 'research', 'deep-dive'].includes(t)) || (note.title || '').includes('Report')
  const isJob = safeTags.some(t => ['career', 'job', 'resume'].includes(t))
  const safeDate = note.created_at ? new Date(note.created_at) : new Date()
  const timeStr = isValid(safeDate) ? format(safeDate, 'HH:mm') : '--:--'

  return (
    <div
      onClick={onClick}
      className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          {isReport ? <span className="text-purple-500 bg-purple-50 p-1 rounded text-xs font-bold">報告</span> :
           isJob ? <span className="text-green-600 bg-green-50 p-1 rounded text-xs font-bold">職涯</span> : null}
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {note.title || "無標題"}
          </h3>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {timeStr}
        </span>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
        {note.excerpt || "尚無預覽內容..."}
      </p>

      <div className="flex items-center gap-2">
        {safeTags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { notes } = useNotes()
  const safeNotes = Array.isArray(notes) ? notes : []

  const [searchResults, setSearchResults] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  // Group notes by time
  const timeline = useMemo(() => {
    const groups = { '今天': [], '昨天': [], '本週': [], '更早': [] }

    safeNotes.forEach(note => {
      try {
        const date = parseISO(note.created_at || '')
        if (!isValid(date)) {
          groups['更早'].push(note)
          return
        }
        if (isToday(date)) groups['今天'].push(note)
        else if (isYesterday(date)) groups['昨天'].push(note)
        else if (isThisWeek(date)) groups['本週'].push(note)
        else groups['更早'].push(note)
      } catch {
        groups['更早'].push(note)
      }
    })

    return groups
  }, [safeNotes])

  const handleSearchResults = (results, query) => {
    setSearchResults(results)
    setSearchQuery(query)
  }

  const handleSearchClear = () => {
    setSearchResults(null)
    setSearchQuery('')
  }

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  // Determine which notes to display
  const isSearching = searchResults !== null
  const displayNotes = isSearching
    ? filterByTags(searchResults, selectedTags)
    : filterByTags(safeNotes, selectedTags)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      {/* Mobile Header */}
      <div className="flex justify-between items-center mb-8 md:hidden">
        <h1 className="text-2xl font-bold text-gray-900">我的筆記</h1>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
          ME
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar onResults={handleSearchResults} onClear={handleSearchClear} />
      </div>

      {/* Tag Filter */}
      <div className="mb-6">
        <TagFilter notes={isSearching ? searchResults : safeNotes} selectedTags={selectedTags} onToggle={handleTagToggle} />
      </div>

      {/* Search Results (CardGrid) */}
      {isSearching ? (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            搜尋「{searchQuery}」的結果（{displayNotes.length} 筆）
          </h2>
          <CardGrid notes={displayNotes} onNoteClick={handleNoteClick} emptyMessage="找不到符合的筆記" />
        </div>
      ) : selectedTags.length > 0 ? (
        /* Filtered by tags — show as CardGrid */
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            篩選結果（{displayNotes.length} 筆）
          </h2>
          <CardGrid notes={displayNotes} onNoteClick={handleNoteClick} emptyMessage="沒有符合標籤的筆記" />
        </div>
      ) : (
        /* Default: Timeline View */
        <div className="space-y-8">
          {Object.entries(timeline).map(([label, group]) => (
            group.length > 0 && (
              <div key={label} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">{label}</h2>
                <div className="space-y-3">
                  {group.map(note => (
                    <TimelineCard key={note.id} note={note} onClick={() => navigate(`/note/${note.id}`)} />
                  ))}
                </div>
              </div>
            )
          ))}

          {safeNotes.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book size={32} className="opacity-20" />
              </div>
              <p>還沒有筆記</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
