/**
 * Safe date formatting utilities for Cortex Notes.
 *
 * Key insight: notes store created_at as either:
 *   - Pure date: "2026-02-16" (no time info)
 *   - Full ISO: "2026-02-16T01:42:13Z" (has time)
 *
 * new Date("2026-02-16") parses as UTC midnight, which shifts in local timezone
 * (e.g. UTC+8 → "上午8:00:00", UTC-5 → previous day). Pure dates must be
 * displayed as-is without timezone conversion.
 */

/** True if the string contains a 'T' (ISO datetime) */
function hasTimePart(dateStr) {
  return typeof dateStr === 'string' && dateStr.includes('T')
}

/**
 * Format a date string for short display (e.g. "2月16日").
 * Pure dates are parsed manually to avoid timezone shift.
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  try {
    if (hasTimePart(dateStr)) {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
    }
    // Pure date string — parse directly to avoid UTC→local shift
    const [, , mo, da] = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/) || []
    if (!mo) return dateStr
    return `${parseInt(mo)}月${parseInt(da)}日`
  } catch {
    return ''
  }
}

/**
 * Format a date string for full display.
 * Pure dates show date only; ISO datetimes show date + time.
 */
export function formatDateFull(dateStr) {
  if (!dateStr) return ''
  if (hasTimePart(dateStr)) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString()
  }
  return dateStr
}

/**
 * Format time portion only (e.g. "14:30"). Returns '' for pure dates.
 */
export function formatTimeOnly(dateStr) {
  if (!dateStr || !hasTimePart(dateStr)) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
