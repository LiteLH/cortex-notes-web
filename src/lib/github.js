import { Octokit } from "octokit";
import { Buffer } from "buffer";
import matter from "gray-matter";

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
      
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { content, sha: data.sha };
    } catch (e) {
      console.error(`Error fetching ${path}:`, e);
      return null;
    }
  }

  async getNotesIndex() {
    const file = await this.getFileContent(INDEX_PATH);
    if (!file) return [];
    try {
      return JSON.parse(file.content);
    } catch (e) {
      console.error("Error parsing index.json", e);
      return [];
    }
  }

  async getNote(path) {
    const file = await this.getFileContent(path);
    if (!file) return null;
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
    const existing = await this.getFileContent(path);
    if (existing) sha = existing.sha;

    // 4. Commit Note File
    await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: DB_REPO_OWNER,
        repo: DB_REPO_NAME,
        path: path,
        message: `feat: update note ${note.title}`,
        content: Buffer.from(markdown).toString("base64"),
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
    const indexFile = await this.getFileContent(INDEX_PATH);
    let index = [];
    let sha = undefined;

    if (indexFile) {
        index = JSON.parse(indexFile.content);
        sha = indexFile.sha;
    }

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
        content: Buffer.from(JSON.stringify(index, null, 2)).toString("base64"),
        sha: sha
    });
  }
}
