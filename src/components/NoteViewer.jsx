import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'
import { HtmlRenderer } from './HtmlRenderer.jsx'
import { findRelatedNotes } from '../lib/related.js'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { Loader2, ArrowRight, FileText } from 'lucide-react'
import { StalenessIndicator } from './StalenessIndicator.jsx'
import { isValid } from 'date-fns'

export function NoteViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { service } = useAuth()
  const { notes, optimisticDelete } = useNotes()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!service) return
    setLoading(true)
    setError(null)

    const localNote = notes.find(n => n.id === id)
    if (localNote && localNote.content) {
      setNote(localNote)
      setLoading(false)
      return
    }

    service.getNotesIndex().then(index => {
      const entry = index.find(n => n.id === id) || localNote

      if (entry) {
        const path = entry.path || `content/${new Date().getFullYear()}/${id}.md`
        service.getNote(path, entry.format)
          .then(n => {
            setNote({ ...entry, ...n })
            setLoading(false)
          })
          .catch(err => {
            console.warn("Standard fetch failed, trying direct content fetch...", err)
            setError("筆記內容未找到（可能正在索引中）")
            setLoading(false)
          })
      } else {
        const year = new Date().getFullYear()
        const blindPath = `content/${year}/${id}.md`
        service.getNote(blindPath)
          .then(n => {
            setNote(n)
            setLoading(false)
          })
          .catch(() => {
            setError("在索引或儲存中找不到筆記")
            setLoading(false)
          })
      }
    }).catch(() => {
      setError("無法載入索引")
      setLoading(false)
    })
  }, [id, service, notes])

  const handleDelete = async () => {
    if (!confirm("確定要刪除這篇筆記嗎？")) return
    setDeleting(true)
    try {
      const path = note?.path || `content/${new Date().getFullYear()}/${id}.md`
      await service.deleteNote(id, path)
      if (optimisticDelete) optimisticDelete(id)
      navigate('/')
    } catch (e) {
      alert(`刪除失敗：${e.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Related notes via weighted multi-factor scoring (must be before early returns to keep hook order stable)
  const relatedNotes = useMemo(() => {
    if (!notes.length || !note) return []
    return findRelatedNotes(note, notes, 5)
  }, [notes, note])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
  if (error) return (
    <div className="p-8 text-center">
      <div className="text-red-500 mb-2">Error: {error}</div>
      <button onClick={() => window.location.reload()} className="text-blue-500 underline">重試</button>
    </div>
  )
  if (!note) return <div className="p-8 text-center">找不到筆記</div>

  const isHtml = note.format === 'html'
  const isValidHtmlPath = isHtml && (note.path || '').startsWith('reports/')

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
            {deleting ? '刪除中...' : '刪除'}
          </button>
          {!isHtml && (
            <button onClick={() => navigate(`/edit/${id}`)} className="text-blue-600 font-medium text-sm px-3 hover:bg-blue-50 rounded">編輯</button>
          )}
        </div>
      </div>

      <div className="px-6 py-8">
        <StalenessIndicator note={note} />
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
          <article className="prose prose-slate prose-lg max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {note.content || ''}
            </Markdown>
          </article>
        )}

        {/* Related Notes */}
        {relatedNotes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">相關筆記</h3>
            <div className="space-y-2">
              {relatedNotes.map(rn => (
                <button
                  key={rn.id}
                  onClick={() => navigate(`/note/${rn.id}`)}
                  className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{rn.title || '無標題'}</div>
                    {rn.excerpt && (
                      <div className="text-xs text-gray-400 truncate">{rn.excerpt}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
