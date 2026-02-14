# HTML Report Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable cortex-notes-web to display HTML reports from cortex-notes-db with their original rich styling, using sandboxed iframes.

**Architecture:** HTML reports are indexed by an extended `update_index.py` (using stdlib `html.parser`), stored in `index.json` with `"format": "html"`. The frontend detects this format and renders content in a `sandbox=""` iframe with injected CSP, instead of the markdown renderer. CI is consolidated into a single workflow.

**Tech Stack:** React 19, Python 3.11 stdlib (`html.parser`), GitHub Actions

**Repos:**
- Frontend: `/home/lide/cortex-notes-web/` (GitHub: LiteLH/cortex-notes-web)
- Database: `/home/lide/cortex-notes-db/` (GitHub: LiteLH/cortex-notes-db)

---

### Task 1: Extend update_index.py to scan HTML files

**Files:**
- Modify: `/home/lide/cortex-notes-db/scripts/update_index.py`

**Step 1: Add HtmlTextExtractor class using stdlib html.parser**

Add after the existing imports (line 5):

```python
from html.parser import HTMLParser

HTML_SCAN_DIRS = {'reports'}

class HtmlTextExtractor(HTMLParser):
    """Extract title and body text from HTML, ignoring style/script content."""
    def __init__(self):
        super().__init__()
        self.text = []
        self.title = None
        self._in_title = False
        self._in_skip = False  # inside <style> or <script>

    def handle_starttag(self, tag, attrs):
        if tag == 'title':
            self._in_title = True
        if tag in ('style', 'script'):
            self._in_skip = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False
        if tag in ('style', 'script'):
            self._in_skip = False

    def handle_data(self, data):
        if self._in_title:
            self.title = data.strip()
        elif not self._in_skip:
            stripped = data.strip()
            if stripped:
                self.text.append(stripped)

    def get_text(self):
        return ' '.join(self.text)
```

**Step 2: Modify scan_notes() to also scan HTML files**

Replace the `scan_notes()` function (lines 71-112):

```python
def scan_notes():
    """掃描所有 .md 和 reports/*.html 文件"""
    notes = []

    # Scan markdown files
    for md_file in REPO_ROOT.rglob('*.md'):
        if any(excluded in md_file.parts for excluded in EXCLUDE_DIRS):
            continue
        if md_file.name in EXCLUDE_FILES:
            continue

        try:
            content = md_file.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Warning: Could not read {md_file}: {e}")
            continue

        fm = extract_frontmatter(content)
        relative_path = md_file.relative_to(REPO_ROOT)
        stat = md_file.stat()

        note = {
            "id": fm.get('id') or generate_id(md_file),
            "title": get_title_from_content(content, md_file.name),
            "tags": fm.get('tags', []),
            "created_at": fm.get('created_at') or datetime.fromtimestamp(stat.st_ctime).isoformat() + "Z",
            "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat() + "Z",
            "status": fm.get('status', 'active'),
            "path": str(relative_path),
            "excerpt": content[:200].replace('\n', ' ').strip() + "..."
        }
        notes.append(note)

    # Scan HTML files in allowed directories only
    for html_dir in HTML_SCAN_DIRS:
        scan_path = REPO_ROOT / html_dir
        if not scan_path.exists():
            continue
        for html_file in scan_path.rglob('*.html'):
            try:
                content = html_file.read_text(encoding='utf-8')
            except Exception as e:
                print(f"Warning: Could not read {html_file}: {e}")
                continue

            extractor = HtmlTextExtractor()
            extractor.feed(content)

            relative_path = html_file.relative_to(REPO_ROOT)
            stat = html_file.stat()
            body_text = extractor.get_text()

            note = {
                "id": generate_id(html_file),
                "title": extractor.title or html_file.stem.replace('_', ' ').replace('-', ' '),
                "tags": ["report"],
                "format": "html",
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat() + "Z",
                "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat() + "Z",
                "status": "active",
                "path": str(relative_path),
                "excerpt": body_text[:200] + "..." if body_text else ""
            }
            notes.append(note)

    notes.sort(key=lambda x: x['updated_at'], reverse=True)
    return notes
```

**Step 3: Run the script locally to verify**

Run: `cd /home/lide/cortex-notes-db && python3 scripts/update_index.py`

Expected: Output shows the 4 HTML files indexed alongside existing markdown files. Verify `index.json` contains entries with `"format": "html"` and `"path": "reports/..."`.

**Step 4: Commit**

```bash
cd /home/lide/cortex-notes-db
git add scripts/update_index.py index.json
git commit -m "feat: extend index to scan HTML reports in reports/"
```

---

### Task 2: Consolidate CI workflows

**Files:**
- Rewrite: `/home/lide/cortex-notes-db/.github/workflows/update-index.yml`
- Delete: `/home/lide/cortex-notes-db/.github/workflows/rebuild-index.yml`

**Step 1: Rewrite update-index.yml**

Replace entire file with:

```yaml
name: Update Index

on:
  push:
    paths:
      - '**/*.md'
      - 'reports/**/*.html'
      - '!README.md'
      - '!CHANGELOG.md'
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: index-update
  cancel-in-progress: true

permissions:
  contents: write

jobs:
  update-index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Update index.json
        run: python3 scripts/update_index.py

      - name: Commit and push if changed
        run: |
          git config --local user.email "yachiyo@openclaw.ai"
          git config --local user.name "Yachiyo Bot"
          git diff --quiet index.json || \
            (git add index.json && git commit -m "chore: update index [skip ci]" && git push)
```

**Step 2: Delete rebuild-index.yml**

```bash
cd /home/lide/cortex-notes-db
rm .github/workflows/rebuild-index.yml
```

**Step 3: Commit**

```bash
cd /home/lide/cortex-notes-db
git add .github/workflows/update-index.yml
git rm .github/workflows/rebuild-index.yml
git commit -m "ci: consolidate into single index workflow, add HTML triggers"
```

---

### Task 3: Add HtmlRenderer component to frontend

**Files:**
- Create: `/home/lide/cortex-notes-web/src/components/HtmlRenderer.jsx`

**Step 1: Create HtmlRenderer.jsx**

```jsx
/**
 * Renders HTML content in a sandboxed iframe with strict security.
 * Used for Antigravity Deep Researcher reports.
 */
export function HtmlRenderer({ content, title }) {
  // Security: refuse to render if content is empty
  if (!content) return null;

  // Inject CSP meta tag to block external resource loading
  const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;">';
  const sandboxedContent = csp + content;

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <iframe
        srcDoc={sandboxedContent}
        sandbox=""
        className="w-full border-none"
        style={{ height: 'calc(100vh - 200px)' }}
        title={title || 'HTML Report'}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
cd /home/lide/cortex-notes-web
git add src/components/HtmlRenderer.jsx
git commit -m "feat: add HtmlRenderer component with sandboxed iframe"
```

---

### Task 4: Modify getNote() to handle HTML format

**Files:**
- Modify: `/home/lide/cortex-notes-web/src/lib/github.js:75-80`

**Step 1: Update getNote() to accept format parameter**

Replace `getNote()` (lines 75-80) with:

```javascript
  async getNote(path, format) {
    const file = await this.getFileContent(path);
    if (format === 'html') {
      // HTML files: return raw content, no gray-matter parsing
      return { content: file.content, format: 'html', sha: file.sha };
    }
    // Markdown files: parse frontmatter as before
    const { data, content } = matter(file.content);
    return { ...data, content, sha: file.sha, raw: file.content };
  }
```

**Step 2: Commit**

```bash
cd /home/lide/cortex-notes-web
git add src/lib/github.js
git commit -m "feat: getNote() supports HTML format parameter"
```

---

### Task 5: Update NoteViewer to render HTML reports

**Files:**
- Modify: `/home/lide/cortex-notes-web/src/App.jsx:566-689`

**Step 1: Add HtmlRenderer import at top of App.jsx**

Add after the existing component imports (around line 5):

```javascript
import { HtmlRenderer } from './components/HtmlRenderer';
```

**Step 2: Update NoteViewer useEffect to pass format to getNote()**

In the `useEffect` (lines 574-622), modify the `service.getNote()` calls to pass `entry.format`:

Replace lines 588-617 with:

```javascript
    service.getNotesIndex().then(index => {
      const entry = index.find(n => n.id === id) || localNote;

      if (entry) {
        const path = entry.path || `content/${new Date().getFullYear()}/${id}.md`;
        service.getNote(path, entry.format)
            .then(n => {
                // Merge index metadata with fetched content
                setNote({ ...entry, ...n });
                setLoading(false);
            })
            .catch(err => {
                console.warn("Standard fetch failed, trying direct content fetch...", err);
                setError("Note content not found (yet). It might be indexing.");
                setLoading(false);
            });
      } else {
        const year = new Date().getFullYear();
        const blindPath = `content/${year}/${id}.md`;
        service.getNote(blindPath)
            .then(n => {
                setNote(n);
                setLoading(false);
            })
            .catch(() => {
                setError("Note not found in index or storage.");
                setLoading(false);
            });
      }
    }).catch(err => {
        setError("Failed to load index.");
        setLoading(false);
    });
```

**Step 3: Update the NoteViewer render section**

Replace lines 648-688 with:

```jsx
  const isHtml = note.format === 'html';
  // Security: only allow HTML rendering for files in reports/ directory
  const isValidHtmlPath = isHtml && (note.path || '').startsWith('reports/');

  return (
    <div className={isValidHtmlPath
      ? "mx-auto bg-white min-h-screen pb-24 md:my-4"
      : "max-w-3xl mx-auto bg-white min-h-screen pb-24 md:my-8 md:rounded-2xl md:shadow-sm md:border border-gray-100"
    }>
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-50 z-10 px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowRight className="rotate-180" size={20} />
        </button>
        <div className="flex gap-2">
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 font-medium text-sm px-3 hover:bg-red-50 rounded disabled:opacity-50"
            >
                {deleting ? 'Deleting...' : 'Delete'}
            </button>
            {!isHtml && (
              <button onClick={() => navigate(`/edit/${id}`)} className="text-blue-600 font-medium text-sm px-3 hover:bg-blue-50 rounded">Edit</button>
            )}
        </div>
      </div>

      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{note.title}</h1>
        <div className="flex flex-wrap gap-2 mb-8">
            {Array.isArray(note.tags) && note.tags.map(t => (
                <span key={t} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#{t}</span>
            ))}
            <span className="text-xs text-gray-400 py-1 ml-auto">
                {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
            </span>
        </div>

        {isValidHtmlPath ? (
          <HtmlRenderer content={note.content} title={note.title} />
        ) : isHtml ? (
          <div className="text-red-500">Security error: HTML format not allowed for path: {note.path}</div>
        ) : (
          <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600">
              {(note.content || '').split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return null;
                  if (line.trim() === '---') return <hr key={i} className="border-gray-100" />;
                  if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-blue-200 pl-4 italic text-gray-600">{line.replace('> ', '')}</blockquote>;
                  if (line.startsWith('```')) return null;
                  return <p key={i} className="mb-4 text-gray-700 leading-7">{line}</p>;
              })}
          </article>
        )}
      </div>
    </div>
  );
```

**Step 4: Verify build passes**

Run: `cd /home/lide/cortex-notes-web && npm run build`

Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
cd /home/lide/cortex-notes-web
git add src/App.jsx
git commit -m "feat: NoteViewer renders HTML reports via sandboxed iframe"
```

---

### Task 6: End-to-end verification

**Step 1: Verify index.json contains HTML entries**

Run: `cd /home/lide/cortex-notes-db && python3 -c "import json; data=json.load(open('index.json')); html=[n for n in data if n.get('format')=='html']; print(f'{len(html)} HTML entries'); [print(f'  - {n[\"title\"]} ({n[\"path\"]})') for n in html]"`

Expected: 4 HTML entries with titles extracted from `<title>` tags and paths starting with `reports/`.

**Step 2: Verify frontend build**

Run: `cd /home/lide/cortex-notes-web && npm run build`

Expected: Build succeeds.

**Step 3: Test locally with dev server**

Run: `cd /home/lide/cortex-notes-web && npm run dev`

Manual test: Open browser, authenticate, navigate to an HTML report from the note list. Verify:
- Report renders with original dark theme / gradients / styling
- Edit button is hidden
- Back navigation works
- Delete button is present

**Step 4: Push both repos**

```bash
cd /home/lide/cortex-notes-db && git push origin main
cd /home/lide/cortex-notes-web && git push origin main
```

---

## Summary

| Task | Repo | What |
|------|------|------|
| 1 | cortex-notes-db | Extend update_index.py with HtmlTextExtractor |
| 2 | cortex-notes-db | Consolidate CI into single workflow |
| 3 | cortex-notes-web | Add HtmlRenderer component |
| 4 | cortex-notes-web | Modify getNote() for HTML format |
| 5 | cortex-notes-web | Update NoteViewer with HTML rendering branch |
| 6 | Both | End-to-end verification and push |
