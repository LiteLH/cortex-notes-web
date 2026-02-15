import { createSearchIndex, searchNotes } from './search.js'

/**
 * Find related notes.
 * Prefers pre-computed `related` field from index.json (TF-IDF, build-time).
 * Falls back to client-side weighted scoring if not available.
 */
export function findRelatedNotes(currentNote, allNotes, maxResults = 5) {
  if (!currentNote || allNotes.length <= 1) return []

  // Prefer pre-computed related IDs from index.json
  if (currentNote.related?.length) {
    const noteMap = new Map(allNotes.map(n => [n.id, n]))
    return currentNote.related
      .slice(0, maxResults)
      .map(id => noteMap.get(id))
      .filter(Boolean)
  }

  // Fallback: client-side scoring
  const others = allNotes.filter(n => n.id !== currentNote.id)
  const currentTags = new Set([...(currentNote.tags || []), ...(currentNote.ai_tags || [])])

  let searchScores = {}
  if (allNotes.length > 1) {
    const index = createSearchIndex(allNotes)
    const query = [currentNote.title, ...(currentNote.tags || [])].join(' ')
    const results = searchNotes(index, query)
    const maxScore = results[0]?.score || 1
    for (const r of results) {
      searchScores[r.id] = r.score / maxScore
    }
  }

  const currentTime = new Date(currentNote.created_at || 0).getTime()
  const maxTimeDiff = 90 * 86400000

  const scored = others.map(note => {
    const noteTags = new Set([...(note.tags || []), ...(note.ai_tags || [])])
    const intersection = [...currentTags].filter(t => noteTags.has(t)).length
    const union = new Set([...currentTags, ...noteTags]).size
    const tagScore = union > 0 ? intersection / union : 0
    const textScore = searchScores[note.id] || 0
    const typeScore = (note.note_type && note.note_type === currentNote.note_type) ? 1 : 0
    const noteTime = new Date(note.created_at || 0).getTime()
    const timeScore = Math.max(0, 1 - Math.abs(currentTime - noteTime) / maxTimeDiff)
    const total = tagScore * 0.4 + textScore * 0.4 + typeScore * 0.1 + timeScore * 0.1
    return { ...note, _score: total }
  })

  return scored
    .sort((a, b) => b._score - a._score)
    .filter(n => n._score > 0.05)
    .slice(0, maxResults)
}
