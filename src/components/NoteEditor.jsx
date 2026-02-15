import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'
import { Loader2, Tag } from 'lucide-react'

export function NoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { service } = useAuth()
  const { optimisticUpdate } = useNotes()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [originalCreatedAt, setOriginalCreatedAt] = useState(null)
  const [originalPath, setOriginalPath] = useState(null)

  useEffect(() => {
    if (id) {
      service.getNotesIndex().then(index => {
        const entry = index.find(n => n.id === id)
        if (entry) {
          setOriginalCreatedAt(entry.created_at)
          setOriginalPath(entry.path)
          service.getNote(entry.path).then(n => {
            setTitle(n.title)
            setContent(n.content)
            setTags(Array.isArray(n.tags) ? n.tags.join(', ') : '')
            if (n.created_at) setOriginalCreatedAt(n.created_at)
          })
        }
      })
    }
  }, [id, service])

  const handleSave = async () => {
    if (!title.trim()) return alert("請輸入標題")
    setSaving(true)
    try {
      const noteId = id || crypto.randomUUID()
      const noteData = {
        id: noteId,
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        created_at: originalCreatedAt || new Date().toISOString(),
        path: originalPath || `content/${new Date().getFullYear()}/${noteId}.md`
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
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">取消</button>
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
          <input
            className="w-full text-3xl md:text-4xl font-bold mb-6 outline-none placeholder:text-gray-200"
            placeholder="標題"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="flex items-center gap-3 text-gray-400 mb-8 border-b border-gray-50 pb-4">
            <Tag size={18} />
            <input
              className="flex-1 outline-none text-base placeholder:text-gray-300"
              placeholder="輸入標籤（以逗號分隔）"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <textarea
            className="w-full flex-1 min-h-[200px] resize-none outline-none text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 font-serif"
            placeholder="開始寫作..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
