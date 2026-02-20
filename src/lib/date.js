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
  // gray-matter auto-converts YAML dates to Date objects — coerce back to ISO string
  if (dateStr instanceof Date) {
    dateStr = isNaN(dateStr.getTime()) ? '' : dateStr.toISOString().slice(0, 10)
  }
  if (hasTimePart(dateStr)) {
    throw new Error(
      `formatDateShort only accepts pure dates (YYYY-MM-DD), got: "${dateStr}". Use formatDateFull() for datetime strings.`,
    )
  }
  try {
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
  // gray-matter auto-converts YAML dates to Date objects — coerce back to string
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return ''
    // gray-matter converts "2026-02-17" → Date(UTC midnight). Show date only.
    return dateStr.toISOString().slice(0, 10)
  }
  if (hasTimePart(dateStr)) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString()
  }
  return dateStr
}

/**
 * Smart short date formatter for mixed created_at formats.
 * Accepts both pure dates ("2026-02-16") and ISO datetime ("2026-02-16T08:00:00Z").
 * Always returns a short date like "2月16日".
 */
export function formatDateSmart(dateStr) {
  if (!dateStr) return ''
  // gray-matter auto-converts YAML dates to Date objects
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? '' : `${dateStr.getMonth() + 1}月${dateStr.getDate()}日`
  }
  if (hasTimePart(dateStr)) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  return formatDateShort(dateStr)
}

/**
 * Format time portion only (e.g. "14:30"). Returns '' for pure dates.
 */
export function formatTimeOnly(dateStr) {
  if (!dateStr) return ''
  // gray-matter auto-converts YAML dates to Date objects (always UTC midnight = no real time)
  if (dateStr instanceof Date) return ''
  if (!hasTimePart(dateStr)) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
