import MiniSearch from 'minisearch'

/**
 * Bilingual synonym map for query expansion.
 * Expands Chinese terms to English equivalents and vice versa,
 * plus common technical abbreviations.
 */
const SYNONYMS = {
  // AI/ML terms
  embedding: ['嵌入', '向量'],
  嵌入: ['embedding', '向量'],
  向量: ['embedding', '嵌入', 'vector'],
  vector: ['向量', 'embedding'],
  llm: ['大型語言模型', '語言模型'],
  大型語言模型: ['llm', '語言模型'],
  語言模型: ['llm', '大型語言模型'],
  agent: ['代理人', '代理'],
  代理人: ['agent', '代理'],
  prompt: ['提示詞', '提示'],
  提示詞: ['prompt'],
  rag: ['檢索增強生成'],
  檢索增強生成: ['rag'],
  微調: ['fine-tune', 'finetune'],
  'fine-tune': ['微調'],

  // Hardware/IC terms
  soc: ['系統單晶片', '晶片'],
  系統單晶片: ['soc'],
  serdes: ['高速串列'],
  pcb: ['印刷電路板', '電路板'],
  電路板: ['pcb'],
  ddr: ['記憶體', 'lpddr'],
  lpddr: ['ddr', '記憶體'],

  // System terms
  搜尋: ['search', '檢索', '搜索'],
  search: ['搜尋', '檢索', '搜索'],
  檢索: ['search', '搜尋'],
  備份: ['backup'],
  backup: ['備份'],
  監控: ['monitor', 'monitoring'],
  monitor: ['監控'],
  排程: ['cron', 'schedule'],
  cron: ['排程'],
  部署: ['deploy', 'deployment'],
  deploy: ['部署'],

  // Knowledge management
  筆記: ['note', '備忘'],
  note: ['筆記', '備忘'],
  決策: ['decision'],
  decision: ['決策'],
  研究: ['research'],
  research: ['研究'],
  報告: ['report'],
  report: ['報告'],
}

/**
 * Expand a query with synonyms.
 * Returns the original query plus synonym-expanded terms.
 */
export function expandQuery(query) {
  const tokens = (query || '').toLowerCase().match(/[\u4e00-\u9fff]+|[a-zA-Z0-9-]+/g) || []
  const expanded = new Set(tokens)
  for (const token of tokens) {
    const syns = SYNONYMS[token]
    if (syns) {
      for (const syn of syns) expanded.add(syn.toLowerCase())
    }
  }
  return [...expanded].join(' ')
}

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
 * Search notes using MiniSearch index with synonym expansion.
 * Returns { hits, expanded } where hits is array of { id, score, match }
 * and expanded indicates if synonym expansion was used.
 */
export function searchNotes(index, query) {
  if (!query || !query.trim()) return { hits: [], expanded: false }
  const trimmed = query.trim()

  // Try original query first
  let hits = index.search(trimmed)
  if (hits.length > 0) return { hits, expanded: false }

  // No results — try with synonym expansion
  const expandedQuery = expandQuery(trimmed)
  if (expandedQuery !== trimmed.toLowerCase()) {
    hits = index.search(expandedQuery)
    if (hits.length > 0) return { hits, expanded: true }
  }

  return { hits: [], expanded: false }
}
