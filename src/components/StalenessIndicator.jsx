import { AlertTriangle, Clock } from 'lucide-react'

const DAY_MS = 86400000

export function getStalenessInfo(note) {
  if (!note?.note_type || !note?.created_at) return null

  const age = Math.floor((Date.now() - new Date(note.created_at).getTime()) / DAY_MS)
  const type = note.note_type

  if (type === 'decision' && !note.next_review && age > 90) {
    return { level: 'warning', message: '此決策記錄超過 90 天且未設定回顧日期，考慮設定回顧排程' }
  }
  if (type === 'learning' && age > 90) {
    return { level: 'warning', message: '此學習筆記可能已過時，建議確認內容是否仍然適用' }
  }
  if (type === 'thought' && age > 90) {
    return { level: 'info', message: `${Math.floor(age / 30)} 個月前的想法` }
  }
  if (type === 'meeting' && age > 30) {
    return { level: 'info', message: '此會議記錄已超過 30 天' }
  }
  return null
}

export function StalenessIndicator({ note }) {
  const info = getStalenessInfo(note)
  if (!info) return null

  const isWarning = info.level === 'warning'
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm mb-4 ${
        isWarning ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'
      }`}
    >
      {isWarning ? <AlertTriangle size={16} /> : <Clock size={16} />}
      <span>{info.message}</span>
    </div>
  )
}
