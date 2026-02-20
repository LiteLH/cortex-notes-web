import { List, LayoutGrid, ArrowUpDown, Clock } from 'lucide-react'
import { VIEW_MODES } from '../hooks/useDisplayConfig.js'

const ICONS = { List, LayoutGrid, ArrowUpDown, Clock }

export function ViewModeSelector({ mode, onModeChange }) {
  return (
    <div
      className="flex items-center gap-1 bg-gray-100 rounded-lg p-1"
      role="radiogroup"
      aria-label="顯示模式"
    >
      {VIEW_MODES.map(({ value, label, icon, desktopOnly, tooltip }) => {
        const Icon = ICONS[icon]
        const isActive = mode === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={tooltip}
            onClick={() => onModeChange(value)}
            className={`p-1.5 rounded-md transition-colors ${desktopOnly ? 'hidden md:flex' : 'flex'} items-center justify-center ${
              isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
