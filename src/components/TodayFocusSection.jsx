import { useMemo } from 'react'
import { Lightbulb, Sparkles, ArrowRight } from 'lucide-react'
import { pickRediscovery } from './RediscoverySection.jsx'

const DAY_MS = 86400000

export function TodayFocusSection({ notes, onNoteClick }) {
  const { today, nowMs } = useMemo(() => {
    const d = new Date()
    return {
      today: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      nowMs: d.getTime(),
    }
  }, [])

  const rediscoveryNotes = useMemo(() => pickRediscovery(notes, today), [notes, today])

  if (rediscoveryNotes.length === 0) {
    return (
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-400">目前沒有可推薦的舊筆記</p>
      </div>
    )
  }

  const daysAgo = (dateStr) => Math.floor((nowMs - new Date(dateStr).getTime()) / DAY_MS)

  return (
    <div className="mb-6 bg-gradient-to-br from-violet-50 to-gray-50 border border-violet-200/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Lightbulb size={16} className="text-violet-600" />
        今日焦點
      </h2>

      <div>
        <div className="text-xs text-violet-600 font-medium mb-2 flex items-center gap-1">
          <Sparkles size={12} />
          回憶角落
        </div>
        <div className="space-y-1.5">
          {rediscoveryNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteClick(note)}
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg hover:bg-violet-50 border border-violet-100 transition-colors text-left"
            >
              <div className="min-w-0">
                <div className="text-xs text-violet-500 mb-0.5">
                  {daysAgo(note.created_at)} 天前你記錄了這個...
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{note.title}</div>
              </div>
              <ArrowRight size={14} className="text-violet-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
