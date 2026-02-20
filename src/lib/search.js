import MiniSearch from 'minisearch'

/**
 * Create a MiniSearch index from notes array.
 * Uses pre-computed search_tokens (jieba) when available,
 * falls back to client-side unigram tokenization.
 */
export function createSearchIndex(notes) {
  // Check if any note has pre-computed search_tokens
  const hasPreTokens = notes.some((n) => n.search_tokens?.length)

  const index = new MiniSearch({
    fields: hasPreTokens
      ? ['title', 'tokens_text', 'tags_text']
      : ['title', 'searchable_text', 'tags_text'],
    storeFields: ['id'],
    tokenize: hasPreTokens
      ? (text) => {
          // For pre-tokenized text: split on spaces (tokens joined with spaces)
          // For title/tags: use standard word splitting
          return (text || '').split(/\s+/).filter(Boolean)
        }
      : (text) => {
          // Fallback: Chinese unigram + English word-based
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
    const doc = {
      id: note.id,
      title: note.title || '',
      tags_text: [...(note.tags || []), ...(note.ai_tags || [])].join(' '),
    }
    if (hasPreTokens) {
      doc.tokens_text = (note.search_tokens || []).join(' ')
    } else {
      doc.searchable_text = note.searchable_text || note.excerpt || ''
    }
    docs.push(doc)
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
