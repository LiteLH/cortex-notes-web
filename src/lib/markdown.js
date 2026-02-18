/**
 * Strip common Markdown syntax from text for plain-text display (excerpts, previews).
 * Not a full parser — covers headings, bold, italic, inline code, links, list bullets.
 */
export function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^#{1,6}\s+/gm, '')           // headings
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')   // bold-italic ***text***
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/~~([^~]+)~~/g, '$1')         // strikethrough
    .replace(/_([^_]+)_/g, '$1')            // underscore italic
    .replace(/`([^`]+)`/g, '$1')            // inline code
    .replace(/```[\s\S]*?```/g, '')         // fenced code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links [text](url)
    .replace(/^[-*+]\s+/gm, '')            // unordered list bullets
    .replace(/^\d+\.\s+/gm, '')            // ordered list numbers
    .replace(/^>\s+/gm, '')                // blockquotes
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .trim()
}
