import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'
import { SearchBar } from './SearchBar.jsx'
import { FacetedFilter, applyFacets } from './FacetedFilter.jsx'
import { Calendar } from './Calendar.jsx'
import { PinnedSection } from './PinnedSection.jsx'
import { TodayFocusSection } from './TodayFocusSection.jsx'
import { ViewModeSelector } from './ViewModeSelector.jsx'
import { InsightBar } from './InsightBar.jsx'
import { useDisplayConfig } from '../hooks/useDisplayConfig.js'
import { CompactListRenderer } from './renderers/CompactListRenderer.jsx'
import { SmallCardRenderer } from './renderers/SmallCardRenderer.jsx'
import { SortableListRenderer } from './renderers/SortableListRenderer.jsx'
import { TimelineRenderer } from './renderers/TimelineRenderer.jsx'
import { Book, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useUserState } from '../contexts/UserStateContext.jsx'

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

const RENDERERS = {
  compact: CompactListRenderer,
  card: SmallCardRenderer,
  sortable: SortableListRenderer,
  timeline: TimelineRenderer,
}

export function Home() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { notes, stats, isLoading, error, refreshNotes } = useNotes()
  const safeNotes = useMemo(() => (Array.isArray(notes) ? notes : []), [notes])
  const { config, setMode } = useDisplayConfig()
  const { pins } = useUserState()
  const pinnedIds = useMemo(() => new Set(pins.map((p) => p.noteId)), [pins])

  const [searchResults, setSearchResults] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [facets, setFacets] = useState({})
  const [dateFilter, setDateFilter] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Monthly summary (fallback if stats not available)
  const monthlySummary = useMemo(() => {
    if (stats) return { total: stats.last_30_days_count, reports: 0 }
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonth = safeNotes.filter((n) => n.created_at?.startsWith(monthPrefix))
    return { total: thisMonth.length, reports: 0 }
  }, [safeNotes, stats])

  const handleSearchResults = (results, query) => {
    setSearchResults(results)
    setSearchQuery(query)
  }
  const handleSearchClear = () => {
    setSearchResults(null)
    setSearchQuery('')
  }
  const handleNoteClick = (note) => navigate(`/note/${note.id}`)
  const handleDateClick = (dateStr) => setDateFilter(dateStr)
  const clearDateFilter = () => setDateFilter(null)

  // Filter by date
  const dateFilteredNotes = useMemo(() => {
    if (!dateFilter) return safeNotes
    return safeNotes.filter((note) => note.created_at?.startsWith(dateFilter))
  }, [safeNotes, dateFilter])

  // Determine display notes
  const isSearching = searchResults !== null
  const baseNotes = isSearching ? searchResults : dateFilteredNotes
  const displayNotes = applyFacets(baseNotes, facets)
  const hasAnyFacet = facets.types?.length || facets.tags?.length || facets.timeRange

  // Pick renderer — on mobile, sortable falls back to compact
  const effectiveMode =
    config.mode === 'sortable' && typeof window !== 'undefined' && window.innerWidth < 768
      ? 'compact'
      : config.mode
  const Renderer = RENDERERS[effectiveMode] || CompactListRenderer

  // Three mutually exclusive display states:
  // 1. showSkeleton: first load, no data yet, no error
  // 2. showError: error occurred, no data loaded
  // 3. showContent: data available, or no data + idle (shows empty state)
  const noData = safeNotes.length === 0
  const showSkeleton = isLoading && noData && !error
  const showError = error && noData

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      {/* Mobile Header */}
      <div className="flex justify-between items-center mb-8 md:hidden">
        <h1 className="text-2xl font-bold text-gray-900">我的筆記</h1>
        <button
          onClick={logout}
          aria-label="登出"
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          ME
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar onResults={handleSearchResults} onClear={handleSearchClear} />
      </div>

      {/* Insight Bar */}
      <div className="mb-4">
        <InsightBar stats={stats} />
      </div>

      {/* Loading skeleton — shows during first load (max 15s before timeout) */}
      {showSkeleton && (
        <div className="space-y-3 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error state — shows immediately after timeout, even during SWR retry */}
      {showError && (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg mx-2">
          <p className="font-bold mb-2">載入筆記失敗</p>
          <p className="text-sm text-red-400 break-all px-4 mb-4">
            {error.message || String(error)}
          </p>
          <button
            onClick={refreshNotes}
            className="text-sm text-blue-600 bg-white px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            重試
          </button>
        </div>
      )}

      {/* Main content — only render after data is available */}
      {!showSkeleton && !showError && (
        <>
          {/* Pinned Notes (mobile — sidebar handles desktop) */}
          {!isSearching && (
            <div className="md:hidden">
              <PinnedSection variant="home" />
            </div>
          )}

          {/* Today's Focus (merged review + rediscovery) */}
          {!isSearching && <TodayFocusSection notes={safeNotes} onNoteClick={handleNoteClick} />}

          {/* Calendar (collapsible, desktop) */}
          <div className="mb-6 hidden md:block">
            <button
              onClick={() => setCalendarOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg transition-colors"
            >
              <span>
                📅 月曆
                {monthlySummary.total > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    本月 {monthlySummary.total} 筆
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
              <span>
                顯示 {dateFilter} 的筆記（{dateFilteredNotes.length} 筆）
              </span>
              <button onClick={clearDateFilter} className="ml-auto hover:bg-blue-100 rounded p-0.5">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Faceted Filter + View Mode Selector */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 overflow-hidden">
                <FacetedFilter
                  notes={isSearching ? searchResults : dateFilteredNotes}
                  facets={facets}
                  onFacetsChange={setFacets}
                />
              </div>
              <ViewModeSelector mode={config.mode} onModeChange={setMode} />
            </div>
          </div>

          {/* Content */}
          {isSearching && (
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
              搜尋「{searchQuery}」的結果（{displayNotes.length} 筆，依相關性排列）
            </h2>
          )}
          {!isSearching && (hasAnyFacet || dateFilter) && (
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
              篩選結果（{displayNotes.length} 筆）
            </h2>
          )}

          <Renderer
            notes={displayNotes}
            onNoteClick={handleNoteClick}
            emptyMessage="沒有符合條件的筆記"
            pinnedIds={pinnedIds}
          />

          {safeNotes.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book size={32} className="opacity-20" />
              </div>
              <p>還沒有筆記</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
