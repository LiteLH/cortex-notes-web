import { useState, useCallback } from 'react'

const STORAGE_KEY = 'cortex-display-config'

const DEFAULTS = {
  mode: 'compact',  // compact | card | sortable | timeline
  sort: 'date',     // date | title | type
  sortDir: 'desc',  // asc | desc
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
    setConfigState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveConfig(next)
      return next
    })
  }, [])

  const setMode = useCallback((mode) => setConfig(c => ({ ...c, mode })), [setConfig])
  const setSort = useCallback((sort) => setConfig(c => ({ ...c, sort })), [setConfig])
  const toggleSortDir = useCallback(() => setConfig(c => ({ ...c, sortDir: c.sortDir === 'asc' ? 'desc' : 'asc' })), [setConfig])

  return { config, setMode, setSort, toggleSortDir }
}

export const VIEW_MODES = [
  { value: 'compact', label: '列表', icon: 'List' },
  { value: 'card', label: '卡片', icon: 'LayoutGrid' },
  { value: 'sortable', label: '排序', icon: 'ArrowUpDown', desktopOnly: true },
  { value: 'timeline', label: '時間軸', icon: 'Clock' },
]

export const SORT_OPTIONS = [
  { value: 'date', label: '日期' },
  { value: 'title', label: '標題' },
  { value: 'type', label: '類型' },
]
