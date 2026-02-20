import { useState, useCallback } from 'react'

const STORAGE_KEY = 'cortex-display-config'

const DEFAULTS = {
  mode: 'compact', // compact | card | sortable | timeline
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage unavailable
  }
}

export function useDisplayConfig() {
  const [config, setConfigState] = useState(loadConfig)

  const setConfig = useCallback((updater) => {
    setConfigState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveConfig(next)
      return next
    })
  }, [])

  const setMode = useCallback((mode) => setConfig((c) => ({ ...c, mode })), [setConfig])

  return { config, setMode }
}

export const VIEW_MODES = [
  { value: 'compact', label: '列表', icon: 'List', tooltip: '列表模式（依時間排序）' },
  { value: 'card', label: '卡片', icon: 'LayoutGrid', tooltip: '卡片模式（依時間排序）' },
  {
    value: 'sortable',
    label: '排序',
    icon: 'ArrowUpDown',
    desktopOnly: true,
    tooltip: '欄位排序模式（可點標題切換）',
  },
  {
    value: 'timeline',
    label: '時間軸',
    icon: 'Clock',
    tooltip: '時間軸模式（按今天/昨天/本週分組）',
  },
]
