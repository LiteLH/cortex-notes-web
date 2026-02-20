import { useMemo } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

const DAY_MS = 86400000
const MIN_AGE_DAYS = 30

// Simple seeded PRNG (hash-based)
export function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

export function pickRediscovery(notes, dateStr) {
  const cutoff = Date.now() - MIN_AGE_DAYS * DAY_MS
  const eligible = notes.filter((n) => {
    if (!n.created_at) return false
    return new Date(n.created_at).getTime() < cutoff
  })

  if (eligible.length === 0) return []

  // Weight: decisions > learnings > thoughts > meetings
  const weights = { decision: 4, learning: 3, thought: 2, meeting: 1 }
  const weighted = eligible.map((n) => ({
    note: n,
    weight: weights[n.note_type] || 1,
  }))

  const count = eligible.length >= 3 ? 2 : 1
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
  const picks = []

  for (let pick = 0; pick < count; pick++) {
    const r = seededRandom(dateStr + `-${pick}`)
    let threshold = r * totalWeight
    for (const w of weighted) {
      threshold -= w.weight
      if (threshold <= 0 && !picks.includes(w.note)) {
        picks.push(w.note)
        break
      }
    }
  }

  return picks
}

export function RediscoverySection({ notes, onNoteClick }) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const picks = useMemo(() => pickRediscovery(notes, today), [notes, today])

  if (picks.length === 0) return null

  const daysAgo = (dateStr) => Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS)

  return (
    <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
        <Sparkles size={16} />
        回憶角落
      </h2>
      <div className="space-y-2">
        {picks.map((note) => (
          <button
            key={note.id}
            onClick={() => onNoteClick(note)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-violet-50 border border-violet-100 transition-colors text-left"
          >
            <div className="min-w-0">
              <div className="text-xs text-violet-500 mb-1">
                {daysAgo(note.created_at)} 天前你記錄了這個...
              </div>
              <div className="text-sm font-medium text-gray-800 truncate">{note.title}</div>
            </div>
            <ArrowRight size={14} className="text-violet-400 shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  )
}
