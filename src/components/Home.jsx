import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../contexts/NotesContext.jsx'
import { SearchBar } from './SearchBar.jsx'
import { FacetedFilter, applyFacets } from './FacetedFilter.jsx'
import { CardGrid } from './CardGrid.jsx'
import { Calendar } from './Calendar.jsx'
import { ReviewSection } from './ReviewSection.jsx'
import { RediscoverySection } from './RediscoverySection.jsx'
import { Book, X, ChevronDown, ChevronUp } from 'lucide-react'
import { parseISO, isValid, isToday, isYesterday, isThisWeek, format } from 'date-fns'

const TIMELINE_TYPE_BADGE = {
  decision: { label: '決策', color: 'text-orange-600 bg-orange-50' },
  learning: { label: '學習', color: 'text-green-600 bg-green-50' },
  meeting: { label: '會議', color: 'text-blue-600 bg-blue-50' },
  thought: { label: '想法', color: 'text-gray-600 bg-gray-100' },
  memo: { label: '備忘', color: 'text-teal-600 bg-teal-50' },
}

function TimelineCard({ note, onClick }) {
  const safeTags = Array.isArray(note.tags) ? note.tags : []
  const isHtml = note.format === 'html'
  const badge = isHtml
    ? { label: '報告', color: 'text-purple-500 bg-purple-50' }
    : TIMELINE_TYPE_BADGE[note.note_type] || null
  const safeDate = note.created_at ? new Date(note.created_at) : new Date()
  const timeStr = isValid(safeDate) ? format(safeDate, 'HH:mm') : '--:--'

  return (
    <div
      onClick={onClick}
      className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          {badge && <span className={`${badge.color} p-1 rounded text-xs font-bold`}>{badge.label}</span>}
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

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { notes, isLoading } = useNotes()
  const safeNotes = Array.isArray(notes) ? notes : []

  const [searchResults, setSearchResults] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [facets, setFacets] = useState({})
  const [dateFilter, setDateFilter] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

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

  const handleNoteClick = (note) => {
    navigate(`/note/${note.id}`)
  }

  const handleDateClick = (dateStr) => {
    setDateFilter(dateStr)
  }

  const clearDateFilter = () => {
    setDateFilter(null)
  }

  // Filter by date if active
  const dateFilteredNotes = useMemo(() => {
    if (!dateFilter) return safeNotes
    return safeNotes.filter(note => {
      if (!note.created_at) return false
      return note.created_at.startsWith(dateFilter)
    })
  }, [safeNotes, dateFilter])

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonth = safeNotes.filter(n => n.created_at && n.created_at.startsWith(monthPrefix))
    const reports = thisMonth.filter(n => n.format === 'html' || (n.tags || []).some(t => ['report', 'research'].includes(t)))
    return { total: thisMonth.length, reports: reports.length }
  }, [safeNotes])

  // Determine which notes to display
  const isSearching = searchResults !== null
  const baseNotes = isSearching ? searchResults : dateFilteredNotes
  const displayNotes = applyFacets(baseNotes, facets)
  const hasAnyFacet = facets.types?.length || facets.tags?.length || facets.timeRange

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      {/* Mobile Header */}
      <div className="flex justify-between items-center mb-8 md:hidden">
        <h1 className="text-2xl font-bold text-gray-900">我的筆記</h1>
        <div role="img" aria-label="使用者頭像" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
          ME
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar onResults={handleSearchResults} onClear={handleSearchClear} />
      </div>

      {/* Today's Review */}
      {!isSearching && <ReviewSection notes={safeNotes} onNoteClick={handleNoteClick} />}

      {/* Rediscovery */}
      {!isSearching && <RediscoverySection notes={safeNotes} onNoteClick={handleNoteClick} />}

      {/* Calendar + Monthly Summary (collapsible) */}
      <div className="mb-6 hidden md:block">
        <button
          onClick={() => setCalendarOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg transition-colors"
        >
          <span>
            📅 月曆
            {monthlySummary.total > 0 && (
              <span className="ml-2 text-xs text-gray-400">
                本月 {monthlySummary.total} 筆{monthlySummary.reports > 0 ? ` · ${monthlySummary.reports} 份報告` : ''}
              </span>
            )}
          </span>
          {calendarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {calendarOpen && (
          <div className="mt-2">
            <Calendar notes={safeNotes} onDateClick={handleDateClick} />
          </div>
        )}
      </div>

      {/* Date Filter Indicator */}
      {dateFilter && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <span>顯示 {dateFilter} 的筆記（{dateFilteredNotes.length} 筆）</span>
          <button onClick={clearDateFilter} className="ml-auto hover:bg-blue-100 rounded p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Faceted Filter */}
      <div className="mb-6">
        <FacetedFilter notes={isSearching ? searchResults : dateFilteredNotes} facets={facets} onFacetsChange={setFacets} />
      </div>

      {/* Search Results (CardGrid) */}
      {isSearching ? (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            搜尋「{searchQuery}」的結果（{displayNotes.length} 筆）
          </h2>
          <CardGrid notes={displayNotes} onNoteClick={handleNoteClick} emptyMessage="找不到符合的筆記" />
        </div>
      ) : hasAnyFacet || dateFilter ? (
        /* Filtered by tags or date — show as CardGrid */
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            篩選結果（{displayNotes.length} 筆）
          </h2>
          <CardGrid notes={displayNotes} onNoteClick={handleNoteClick} emptyMessage="沒有符合條件的筆記" />
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

          {isLoading && safeNotes.length === 0 && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!isLoading && safeNotes.length === 0 && (
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
