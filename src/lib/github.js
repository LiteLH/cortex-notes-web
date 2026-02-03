import { Octokit } from "octokit";
import matter from "gray-matter";

// Robust Base64 Decoding for UTF-8 content from GitHub API
function fromBase64(str) {
    try {
        // GitHub API returns base64 with newlines, we must strip them
        const cleanStr = str.replace(/\n/g, '');
        return decodeURIComponent(escape(atob(cleanStr)));
    } catch (e) {
        console.warn("Base64 decode failed", e);
        // Fallback or re-throw
        throw new Error("Failed to decode note content. Encoding issue?");
    }
}

function toBase64(str) {
     return btoa(unescape(encodeURIComponent(str)));
}

// Constants
const DB_REPO_OWNER = "LiteLH"; // Replace with your username if different
const DB_REPO_NAME = "cortex-notes-db";
const INDEX_PATH = "index.json";

export class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    this.token = token;
  }

  async verifyToken() {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return { valid: true, user: data.login };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async getFileContent(path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: path,
      });

      if (Array.isArray(data)) throw new Error("Path is a directory");
      
      const content = fromBase64(data.content);
      return { content, sha: data.sha };
    } catch (e) {
      console.error(`Error fetching ${path}:`, e);
      throw e; // Propagate error to UI
    }
  }

  async getNotesIndex() {
    try {
        const file = await this.getFileContent(INDEX_PATH);
        return JSON.parse(file.content);
    } catch (e) {
        console.error("Error fetching index", e);
        return [];
    }
  }

  async getNote(path) {
    const file = await this.getFileContent(path);
    const { data, content } = matter(file.content);
    return { ...data, content, sha: file.sha, raw: file.content };
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
        status: note.status || 'active'
    });

    // 2. Determine path
    const year = new Date().getFullYear();
    const path = note.path || `content/${year}/${note.id}.md`;
    
    // 3. Get existing SHA if updating
    let sha = undefined;
    try {
        const existing = await this.getFileContent(path);
        sha = existing.sha;
    } catch (e) { /* ignore 404 */ }

    // 4. Commit Note File
    await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: path,
        message: `feat: update note ${note.title}`,
        content: toBase64(markdown),
        sha: sha
    });

    // 5. Update Index
    await this.updateIndex({
        id: note.id,
        title: note.title,
        tags: note.tags || [],
        created_at: note.created_at,
        status: note.status || 'active',
        path: path,
        excerpt: note.content.slice(0, 100) + "..."
    });

    return { success: true, path };
  }

  async updateIndex(entry) {
    let index = [];
    let sha = undefined;

    try {
        const indexFile = await this.getFileContent(INDEX_PATH);
        index = JSON.parse(indexFile.content);
        sha = indexFile.sha;
    } catch (e) { /* ignore */ }

    // Remove old entry if exists
    index = index.filter(i => i.id !== entry.id);
    // Add new entry
    index.unshift(entry);

    // Save Index
    await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: INDEX_PATH,
        message: `chore: update index for ${entry.title}`,
        content: toBase64(JSON.stringify(index, null, 2)),
        sha: sha
    });
  }
}
