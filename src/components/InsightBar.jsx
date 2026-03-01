import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TYPE_LABELS = {
  decision: '決策',
  learning: '學習',
  meeting: '會議',
  thought: '想法',
  memo: '備忘',
  'design-doc': '設計',
  report: '報告',
}

export function InsightBar({ stats }) {
  if (!stats) return null

  const {
    type_distribution,
    last_30_days_count,
    prev_30_days_count,
    total_notes,
  } = stats
  const trend = last_30_days_count - prev_30_days_count
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'

  // Top 3 types
  const topTypes = Object.entries(type_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 overflow-x-auto">
      {/* Total */}
      <div className="flex items-center gap-1.5 shrink-0">
        <BarChart3 size={14} className="text-gray-400" />
        <span className="font-medium text-gray-700">{total_notes}</span>
        <span>筆筆記</span>
      </div>

      {/* Monthly trend — hide when prev month has no data (new system, numbers are identical) */}
      {prev_30_days_count > 0 && (
        <>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-1 shrink-0">
            <span>本月</span>
            <span className="font-medium text-gray-700">{last_30_days_count}</span>
            <TrendIcon size={12} className={trendColor} />
            {trend !== 0 && (
              <span className={trendColor}>
                {trend > 0 ? '+' : ''}
                {trend}
              </span>
            )}
          </div>
        </>
      )}

      <span className="text-gray-200 hidden sm:inline">|</span>

      {/* Type distribution (desktop only) */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {topTypes.map(([type, count]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="text-gray-400">{TYPE_LABELS[type] || type}</span>
            <span className="font-medium text-gray-600">{count}</span>
          </span>
        ))}
      </div>

    </div>
  )
}
