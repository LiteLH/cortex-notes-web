import { useState } from 'react'
import { ChevronDown, ChevronRight, Tag } from 'lucide-react'

export function TagClusterView({ clusters, notes, onNoteClick }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!clusters?.length) {
    return <div className="text-center py-12 text-gray-400">還沒有足夠的標籤資料來分群</div>
  }

  const noteMap = new Map((notes || []).map(n => [n.id, n]))

  const toggle = (idx) => setExpandedIdx(prev => prev === idx ? null : idx)

  return (
    <div className="space-y-2">
      {clusters.map((cluster, idx) => {
        const isExpanded = expandedIdx === idx
        const clusterNotes = (cluster.note_ids || []).map(id => noteMap.get(id)).filter(Boolean)

        return (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
              <Tag size={14} className="text-blue-400" />
              <div className="flex-1 flex flex-wrap gap-1.5">
                {cluster.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                {cluster.note_count} 筆
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50">
                {clusterNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => onNoteClick?.(note)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                  >
                    <span className="flex-1 text-gray-700 truncate">{note.title || '無標題'}</span>
                    <span className="text-xs text-gray-400">
                      {note.created_at ? new Date(note.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
