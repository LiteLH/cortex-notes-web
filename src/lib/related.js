import { createSearchIndex, searchNotes } from './search.js'

/**
 * Find related notes using weighted scoring:
 * - Tag overlap (0.4)
 * - MiniSearch text similarity (0.4)
 * - Same note_type bonus (0.1)
 * - Time proximity (0.1)
 */
export function findRelatedNotes(currentNote, allNotes, maxResults = 5) {
  if (!currentNote || allNotes.length <= 1) return []

  const others = allNotes.filter(n => n.id !== currentNote.id)
  const currentTags = new Set(currentNote.tags || [])

  // MiniSearch scores
  let searchScores = {}
  if (allNotes.length > 1) {
    const index = createSearchIndex(allNotes)
    const query = [currentNote.title, ...(currentNote.tags || [])].join(' ')
    const results = searchNotes(index, query)
    const maxScore = results[0]?.score || 1
    for (const r of results) {
      searchScores[r.id] = r.score / maxScore // normalize to 0-1
    }
  }

  const currentTime = new Date(currentNote.created_at || 0).getTime()
  const maxTimeDiff = 90 * 86400000 // 90 days

  const scored = others.map(note => {
    // Tag overlap score (Jaccard-like)
    const noteTags = new Set(note.tags || [])
    const intersection = [...currentTags].filter(t => noteTags.has(t)).length
    const union = new Set([...currentTags, ...noteTags]).size
    const tagScore = union > 0 ? intersection / union : 0

    // MiniSearch score
    const textScore = searchScores[note.id] || 0

    // Same type bonus
    const typeScore = (note.note_type && note.note_type === currentNote.note_type) ? 1 : 0

    // Time proximity (closer = higher)
    const noteTime = new Date(note.created_at || 0).getTime()
    const timeDiff = Math.abs(currentTime - noteTime)
    const timeScore = Math.max(0, 1 - timeDiff / maxTimeDiff)

    const total = tagScore * 0.4 + textScore * 0.4 + typeScore * 0.1 + timeScore * 0.1

    return { ...note, _score: total }
  })

  return scored
    .sort((a, b) => b._score - a._score)
    .filter(n => n._score > 0.05)
    .slice(0, maxResults)
}
