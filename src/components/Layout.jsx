import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNotes } from '../contexts/NotesContext.jsx'
import { CategoryNav } from './CategoryBrowser.jsx'
import {
  Book, Plus, Search, LogOut, FileText,
  Home as HomeIcon, Folder, FolderOpen
} from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import { isValid } from 'date-fns'
import { formatDateSmart } from '../lib/date.js'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
        active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon size={16} className={active ? "text-blue-600" : "text-gray-400"} />
      {label}
    </button>
  )
}

function Sidebar({ onOpenCmd, className = "" }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { notes } = useNotes()
  const safeNotes = Array.isArray(notes) ? notes : []

  const recentNotes = useMemo(() => safeNotes.slice(0, 5), [safeNotes])
  const tags = useMemo(() => {
    const counts = {}
    safeNotes.forEach(n => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach(t => counts[t] = (counts[t] || 0) + 1)
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [safeNotes])

  const isActive = (path) => location.pathname === path

  return (
    <div className={cn("w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0", className)}>
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200">
          <Book size={18} />
        </div>
        <div className="font-bold text-gray-800 tracking-tight">Cortex</div>
      </div>

      <div className="p-3">
        <button
          onClick={onOpenCmd}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
        >
          <Search size={14} />
          <span>搜尋...</span>
          <kbd className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono text-gray-400">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">開始</div>
          <div className="space-y-0.5">
            <SidebarItem icon={HomeIcon} label="首頁" active={isActive('/')} onClick={() => navigate('/')} />
            <SidebarItem icon={Plus} label="新增筆記" onClick={() => navigate('/new')} />
          </div>
        </div>

        <nav aria-label="分類導航">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">分類瀏覽</div>
          <div className="space-y-0.5">
            <SidebarItem icon={FolderOpen} label="所有分類" active={isActive('/browse')} onClick={() => navigate('/browse')} />
            <CategoryNav notes={safeNotes} onNavigate={navigate} />
          </div>
        </nav>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">近期</div>
          <div className="space-y-0.5">
            {recentNotes.map(note => (
              <button
                key={note.id}
                onClick={() => navigate(`/note/${note.id}`)}
                className="group w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 rounded-md cursor-pointer transition-colors text-left"
              >
                <FileText size={14} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
                <span className="truncate">{note.title || "無標題"}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">標籤</div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {tags.map(([tag]) => (
              <span key={tag} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 hover:border-blue-300 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50/50">
        <button onClick={logout} className="flex items-center gap-2 text-gray-500 text-sm w-full hover:bg-red-50 hover:text-red-600 p-2 rounded transition-colors">
          <LogOut size={16} /> 登出
        </button>
      </div>
    </div>
  )
}

function MobileNav({ onOpenCmd }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix)

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-2">
        <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] ${isActive('/') ? 'text-blue-600' : 'text-gray-400'}`}>
          <HomeIcon size={20} />
          <span className="text-[10px]">首頁</span>
        </button>

        <button onClick={onOpenCmd} className="flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] text-gray-400 active:text-gray-900">
          <Search size={20} />
          <span className="text-[10px]">搜尋</span>
        </button>

        <button
          onClick={() => navigate('/new')}
          className="flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] -mt-5"
        >
          <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform">
            <Plus size={22} />
          </div>
          <span className="text-[10px] text-gray-400">新增</span>
        </button>

        <button onClick={() => navigate('/browse')} className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] ${isActivePrefix('/browse') ? 'text-blue-600' : 'text-gray-400'}`}>
          <FolderOpen size={20} />
          <span className="text-[10px]">分類</span>
        </button>
      </div>
    </nav>
  )
}

function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { notes } = useNotes()
  const safeNotes = Array.isArray(notes) ? notes : []

  return (
    <CommandPrimitive.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-[100] p-4 pt-[20vh] md:pt-[15vh] bg-black/50 backdrop-blur-sm flex justify-center items-start"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div role="dialog" aria-label="搜尋筆記" className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
          <CommandPrimitive.Input
            placeholder="搜尋筆記、標籤、內容..."
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
        <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto p-2">
          <CommandPrimitive.Empty className="py-6 text-center text-sm text-gray-500">找不到相關筆記</CommandPrimitive.Empty>

          <CommandPrimitive.Group heading="操作" className="px-2 py-1.5 text-xs font-medium text-gray-500">
            <CommandPrimitive.Item
              className="flex cursor-default select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-blue-50 aria-selected:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onSelect={() => { onOpenChange(false); navigate('/new') }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>新增筆記</span>
            </CommandPrimitive.Item>
          </CommandPrimitive.Group>

          <CommandPrimitive.Group heading="近期筆記" className="px-2 py-1.5 text-xs font-medium text-gray-500">
            {safeNotes.slice(0, 10).map(note => (
              <CommandPrimitive.Item
                key={note.id}
                className="flex cursor-default select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-blue-50 aria-selected:text-blue-700"
                onSelect={() => { onOpenChange(false); navigate(`/note/${note.id}`) }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{note.title || "無標題"}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatDateSmart(note.created_at)}
                </span>
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.Group>
        </CommandPrimitive.List>
      </div>
    </CommandPrimitive.Dialog>
  )
}

function MobileNavWrapper({ onOpenCmd }) {
  const location = useLocation()
  const isEditing = location.pathname === '/new' || location.pathname.startsWith('/edit/')
  if (isEditing) return null
  return <MobileNav onOpenCmd={onOpenCmd} />
}

export function Layout({ children }) {
  const [openCmd, setOpenCmd] = useState(false)

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCmd((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row overflow-hidden">
      <Sidebar onOpenCmd={() => setOpenCmd(true)} className="hidden md:flex" />
      <main className="flex-1 overflow-auto mb-16 md:mb-0 relative bg-white md:bg-gray-50/50">
        {children}
      </main>
      <MobileNavWrapper onOpenCmd={() => setOpenCmd(true)} />
      {openCmd && <CommandPalette open={openCmd} onOpenChange={setOpenCmd} />}
    </div>
  )
}
