import { Octokit } from 'octokit'
import matter from 'gray-matter'

// Polyfill Buffer because gray-matter uses it internally
// This is the "nuclear option" to fix "Can't find variable: Buffer"
import { Buffer } from 'buffer'
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

// Robust Base64 Decoding for UTF-8 content from GitHub API
function fromBase64(str) {
  try {
    const cleanStr = str.replace(/\n/g, '')
    // Use Node's Buffer if available (better UTF-8 support), else fallback
    return Buffer.from(cleanStr, 'base64').toString('utf-8')
  } catch (e) {
    console.warn('Buffer decode failed, trying native', e)
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))))
  }
}

function toBase64(str) {
  return Buffer.from(str).toString('base64')
}

// Constants
const DB_REPO_OWNER = 'LiteLH' // Replace with your username if different
const DB_REPO_NAME = 'cortex-notes-db'
const INDEX_PATH = 'index.json'
// R2 CDN URL — set via VITE_R2_INDEX_URL env var at build time
const R2_INDEX_URL = import.meta.env.VITE_R2_INDEX_URL || ''

function assertSafePath(path) {
  if (!path || path.includes('..') || path.startsWith('/')) {
    throw new Error(`Unsafe path: ${path}`)
  }
}

export class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token })
    this.token = token
  }

  async verifyToken() {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated()
      return { valid: true, user: data.login }
    } catch (e) {
      return { valid: false, error: e.message }
    }
  }

  async getFileContent(path) {
    assertSafePath(path)
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: path,
      })

      if (Array.isArray(data)) throw new Error('Path is a directory')

      // For large files, GitHub API may not include content (only download_url)
      let content
      if (data.content) {
        content = fromBase64(data.content)
      } else if (data.download_url) {
        const resp = await fetch(data.download_url, { cache: 'no-store' })
        if (!resp.ok)
          throw new Error(`Failed to download ${path}: ${resp.status} ${resp.statusText}`)
        content = await resp.text()
      } else {
        throw new Error(`No content available for ${path}`)
      }
      return { content, sha: data.sha }
    } catch (e) {
      console.error(`Error fetching ${path}:`, e)
      throw e // Propagate error to UI
    }
  }

  async getNotesIndex() {
    // 1. Try R2 CDN first — faster, no size limit, no auth overhead
    if (R2_INDEX_URL) {
      try {
        const resp = await fetch(R2_INDEX_URL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        })
        if (resp.ok) return await resp.json()
      } catch (e) {
        console.warn('R2 fetch failed, falling back to GitHub:', e)
      }
    }
    // 2. Fallback: GitHub raw API (no base64 wrapper, 15s timeout)
    const resp = await fetch(
      `https://api.github.com/repos/${DB_REPO_OWNER}/${DB_REPO_NAME}/contents/${INDEX_PATH}`,
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.raw',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      },
    )
    if (!resp.ok) {
      throw new Error(`GitHub API ${resp.status}: ${resp.statusText}`)
    }
    return await resp.json()
  }

  async getNote(path, format) {
    assertSafePath(path)
    const file = await this.getFileContent(path)
    if (format === 'html') {
      // HTML files: return raw content, no gray-matter parsing
      return { content: file.content, format: 'html', sha: file.sha }
    }
    // Markdown files: parse frontmatter as before
    const { data, content } = matter(file.content)
    return { ...data, content, sha: file.sha, raw: file.content }
  }

  // Create or Update a note
  // 1. Write the .md file
  // 2. Update index.json
  async saveNote(note) {
    // 1. Prepare Content
    const markdown = matter.stringify(note.content, {
      id: note.id,
      title: note.title,
      tags: note.tags || [],
      created_at: note.created_at,
      updated_at: new Date().toISOString(),
      status: note.status || 'active',
    })

    // 2. Determine path
    const year = new Date().getFullYear()
    const path = note.path || `content/${year}/${note.id}.md`
    assertSafePath(path)

    // 3. Get existing SHA if updating
    let sha = undefined
    try {
      const existing = await this.getFileContent(path)
      sha = existing.sha
    } catch {
      /* ignore 404 */
    }

    // 4. Commit Note File
    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: DB_REPO_OWNER,
      repo: DB_REPO_NAME,
      path: path,
      message: `feat: update note ${note.title}`,
      content: toBase64(markdown),
      sha: sha,
    })

    // 5. Update Index (DEPRECATED: Handled by GitHub Actions)
    // No waiting needed. The backend action will pick it up.
    console.log('Note saved. Index update delegated to GitHub Action.')

    return { success: true, path }
  }

  // updateIndex removed - moved to backend action

  // Default empty user state
  static DEFAULT_USER_STATE = { version: 1, pins: [] }
  static USER_STATE_PATH = 'user-state.json'

  async getUserState() {
    try {
      const file = await this.getFileContent(GitHubService.USER_STATE_PATH)
      return { data: JSON.parse(file.content), sha: file.sha }
    } catch (e) {
      if (e.status === 404) {
        return { data: { ...GitHubService.DEFAULT_USER_STATE }, sha: null }
      }
      throw e
    }
  }

  async saveUserState(state, sha, retries = 3) {
    const content = JSON.stringify(state, null, 2)
    try {
      const result = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: GitHubService.USER_STATE_PATH,
        message: 'chore: update user state',
        content: toBase64(content),
        ...(sha ? { sha } : {}),
      })
      return { sha: result.data.content.sha }
    } catch (e) {
      if (e.status === 409 && retries > 0) {
        // SHA conflict — re-read and retry
        const fresh = await this.getUserState()
        return this.saveUserState(state, fresh.sha, retries - 1)
      }
      throw e
    }
  }

  async deleteNote(id, path, sha) {
    if (path) assertSafePath(path)
    if (!path) {
      // Try to guess path - assume created this year if unknown
      path = `content/${new Date().getFullYear()}/${id}.md`
    }

    if (!sha) {
      try {
        const file = await this.getFileContent(path)
        sha = file.sha
      } catch (e) {
        console.error('Delete failed: file not found', e)
        throw new Error('Note file not found, cannot delete.')
      }
    }

    await this.octokit.rest.repos.deleteFile({
      owner: DB_REPO_OWNER,
      repo: DB_REPO_NAME,
      path: path,
      message: `chore: delete note ${id}`,
      sha: sha,
    })

    console.log('Note deleted. Index update delegated to GitHub Action.')
    return { success: true }
  }
}
