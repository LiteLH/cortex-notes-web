import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'
import { Loader2, Tag, FileType } from 'lucide-react'

const NOTE_TYPES = [
  { value: '', label: '自動判斷', path: null },
  { value: 'memo', label: '備忘', path: 'notes/memos' },
  { value: 'decision', label: '決策', path: 'notes/decisions' },
  { value: 'learning', label: '學習', path: 'notes/learnings' },
  { value: 'meeting', label: '會議', path: 'notes/meetings' },
  { value: 'thought', label: '想法', path: 'notes/thoughts' },
]

export function NoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { service } = useAuth()
  const { notes, optimisticUpdate } = useNotes()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [noteType, setNoteType] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [originalCreatedAt, setOriginalCreatedAt] = useState(null)
  const [originalPath, setOriginalPath] = useState(null)

  // Track if content has been modified
  const isDirty = title.trim() !== '' || content.trim() !== ''

  // Warn before browser close/refresh if there are unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm('有未儲存的內容，確定要離開嗎？')) return
    navigate(-1)
  }, [isDirty, navigate])

  // Use SWR-cached notes instead of calling getNotesIndex() again.
  // index.json is ~450KB; redundant fetches add 1-3s on mobile.
  useEffect(() => {
    if (!id || !service) return
    const safeNotes = Array.isArray(notes) ? notes : []
    const entry = safeNotes.find((n) => n.id === id)
    if (!entry) {
      setLoadError(`找不到筆記 ${id}`)
      return
    }
    setOriginalCreatedAt(entry.created_at)
    setOriginalPath(entry.path)
    service
      .getNote(entry.path)
      .then((n) => {
        setTitle(n.title)
        setContent(n.content)
        setTags(Array.isArray(n.tags) ? n.tags.join(', ') : '')
        if (n.created_at) setOriginalCreatedAt(n.created_at)
      })
      .catch((e) => {
        console.error('Failed to load note:', e)
        setLoadError(`載入筆記失敗：${e.message}`)
      })
  }, [id, service, notes])

  const handleSave = async () => {
    if (!title.trim()) return alert('請輸入標題')
    setSaving(true)
    try {
      const noteId = id || crypto.randomUUID()
      // Determine path: use original path if editing, else type-based or default
      let path = originalPath
      if (!path) {
        const typeEntry = NOTE_TYPES.find((t) => t.value === noteType)
        path = typeEntry?.path
          ? `${typeEntry.path}/${noteId}.md`
          : `content/${new Date().getFullYear()}/${noteId}.md`
      }
      const noteData = {
        id: noteId,
        title,
        content,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        created_at: originalCreatedAt || new Date().toISOString(),
        path,
      }

      await service.saveNote(noteData)
      if (optimisticUpdate) optimisticUpdate(noteData)
      navigate(`/note/${noteId}`)
    } catch (e) {
      console.error(e)
      alert(`儲存失敗：${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white md:bg-gray-50/50">
      <div className="md:max-w-3xl md:mx-auto md:my-8 md:bg-white md:rounded-2xl md:shadow-sm md:border border-gray-100 w-full h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            取消
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold shadow-md shadow-gray-200 flex items-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-all"
          >
            {saving && <Loader2 className="animate-spin w-3 h-3" />}
            儲存
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-10 w-full bg-white flex flex-col">
          {loadError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{loadError}</div>
          )}
          <label className="sr-only" htmlFor="note-title">
            標題
          </label>
          <input
            id="note-title"
            className="w-full text-3xl md:text-4xl font-bold mb-6 outline-none placeholder:text-gray-200"
            placeholder="標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Note type selector — only for new notes (editing preserves original path) */}
          {!id && (
            <div className="flex items-center gap-3 text-gray-400 mb-4 border-b border-gray-50 pb-4">
              <FileType size={18} />
              <label className="sr-only" htmlFor="note-type">
                筆記類型
              </label>
              <select
                id="note-type"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="flex-1 outline-none text-base text-gray-600 bg-transparent"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-400 mb-8 border-b border-gray-50 pb-4">
            <Tag size={18} />
            <label className="sr-only" htmlFor="note-tags">
              標籤
            </label>
            <input
              id="note-tags"
              className="flex-1 outline-none text-base placeholder:text-gray-300"
              placeholder="輸入標籤（以逗號分隔）"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <label className="sr-only" htmlFor="note-content">
            內容
          </label>
          <textarea
            id="note-content"
            className="w-full flex-1 min-h-[200px] resize-none outline-none text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 font-serif"
            placeholder="開始寫作..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
