import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function toLocalDateStr(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getHeatmapColor(count) {
  if (count === 0) return ''
  if (count === 1) return 'bg-blue-100'
  if (count <= 3) return 'bg-blue-200'
  return 'bg-blue-300'
}

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]

export function Calendar({ notes, onDateClick }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Set of dates that have notes
  const noteDates = useMemo(() => {
    const dates = new Set()
    for (const note of notes || []) {
      if (note.created_at) {
        const key = toLocalDateStr(note.created_at)
        if (key) dates.add(key)
      }
    }
    return dates
  }, [notes])

  // Count notes per date for this month
  const noteCountByDate = useMemo(() => {
    const counts = {}
    for (const note of notes || []) {
      if (note.created_at) {
        const key = toLocalDateStr(note.created_at)
        if (key) counts[key] = (counts[key] || 0) + 1
      }
    }
    return counts
  }, [notes])

  const daysInMonth = getMonthDays(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayStr = toLocalDateStr(today.toISOString())

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }

  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const hasNotes = noteDates.has(dateStr)
    const count = noteCountByDate[dateStr] || 0
    const isToday = dateStr === todayStr

    const heatmap = getHeatmapColor(count)
    const ariaLabel = `${year}年${month + 1}月${day}日${hasNotes ? `，${count} 筆筆記` : ''}${isToday ? '（今天）' : ''}`
    cells.push(
      <button
        key={day}
        onClick={() => hasNotes && onDateClick?.(dateStr)}
        disabled={!hasNotes}
        aria-label={ariaLabel}
        className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
          ${isToday ? 'font-bold ring-2 ring-blue-400' : ''}
          ${hasNotes ? `cursor-pointer hover:bg-blue-50 text-gray-900 ${heatmap}` : 'text-gray-300 cursor-default'}
        `}
        title={hasNotes ? `${count} 筆筆記` : '這天沒有筆記'}
      >
        {day}
      </button>,
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={goPrev} aria-label="上個月" className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-medium text-gray-700">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={goNext} aria-label="下個月" className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  )
}
