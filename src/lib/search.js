import MiniSearch from 'minisearch'

/**
 * Create a MiniSearch index from notes array.
 * Uses custom tokenizer for Chinese (unigram) + English (word-based).
 */
export function createSearchIndex(notes) {
  const index = new MiniSearch({
    fields: ['title', 'searchable_text', 'tags_text'],
    storeFields: ['id'],
    tokenize: (text) => {
      // Chinese: unigram (single character). English: word-based.
      return (text || '').match(/[\u4e00-\u9fff]|[a-zA-Z0-9]+/g) || []
    },
    searchOptions: {
      boost: { title: 3, tags_text: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  const seen = new Set()
  const docs = []
  for (const note of notes) {
    if (seen.has(note.id)) continue
    seen.add(note.id)
    docs.push({
      id: note.id,
      title: note.title || '',
      searchable_text: note.searchable_text || note.excerpt || '',
      tags_text: (note.tags || []).join(' '),
    })
  }

  index.addAll(docs)
  return index
}

/**
 * Search notes using MiniSearch index.
 * Returns array of { id, score, match } objects.
 */
export function searchNotes(index, query) {
  if (!query || !query.trim()) return []
  return index.search(query.trim())
}
