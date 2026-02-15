import { useState, useEffect, useMemo, useRef, Component } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useNotes } from './contexts/NotesContext.jsx';

import { CategoryBrowser, CategoryNav } from './components/CategoryBrowser';
import { HtmlRenderer } from './components/HtmlRenderer';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  Book, Plus, Search, Menu, LogOut, Loader2, Save, 
  Home as HomeIcon, FileText, Lock, Folder, Tag, Hash, 
  LayoutGrid, List as ListIcon, Clock, ChevronRight, ChevronDown,
  Command, Calendar, ArrowRight, Star, FolderOpen
} from 'lucide-react';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isThisWeek, parseISO, isValid } from 'date-fns';
import { Command as CommandPrimitive } from 'cmdk';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function AuthScreen() {
  const [input, setInput] = useState('');
  const { login, authError } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-100 p-4 justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <Lock size={48} className="mx-auto mb-2 opacity-90" />
          <h1 className="text-2xl font-bold">私人存取</h1>
          <p className="text-blue-100 text-sm mt-1">解鎖筆記本</p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="font-semibold mb-1">為什麼需要這個？</p>
            <p>你的筆記儲存在<strong>私人 GitHub 儲存庫</strong>中。需要提供 Personal Access Token (PAT) 才能存取。</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {authError}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Token</label>
          <input
            type="password"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          <button
            onClick={() => login(input)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md active:transform active:scale-95"
          >
            解鎖筆記本
          </button>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Token 儲存在瀏覽器本機。</p>
            <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 inline-block">
              產生新的 Token (Classic) &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { service, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { notes, refreshNotes, optimisticUpdate, optimisticDelete } = useNotes();
  const [openCmd, setOpenCmd] = useState(false);

  // Command Palette Shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCmd((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row overflow-hidden">
        <Sidebar
          notes={notes}
          service={service}
          onLogout={logout}
          onOpenCmd={() => setOpenCmd(true)}
          className="hidden md:flex"
        />
        <main className="flex-1 overflow-auto mb-16 md:mb-0 relative bg-white md:bg-gray-50/50">
          <Routes>
            <Route path="/" element={<Home notes={notes} service={service} onOpenCmd={() => setOpenCmd(true)} />} />
            <Route path="/browse" element={<CategoryBrowser notes={notes} />} />
            <Route path="/browse/:category" element={<CategoryBrowser notes={notes} />} />
            <Route path="/browse/:category/:subcategory" element={<CategoryBrowser notes={notes} />} />
            <Route path="/note/:id" element={<NoteViewer service={service} notes={notes} onDelete={optimisticDelete} />} />
            <Route path="/new" element={<NoteEditor service={service} onSave={optimisticUpdate} />} />
            <Route path="/edit/:id" element={<NoteEditor service={service} onSave={optimisticUpdate} />} />
          </Routes>
        </main>
        <MobileNav onOpenCmd={() => setOpenCmd(true)} />

        {openCmd && <CommandPalette open={openCmd} onOpenChange={setOpenCmd} notes={notes} />}
      </div>
    </Router>
  );
}

// Command Palette Component (CMDK)
function CommandPalette({ open, onOpenChange, notes }) {
    const navigate = useNavigate();
    
    // Safety: Ensure notes is an array
    const safeNotes = Array.isArray(notes) ? notes : [];

    return (
      <CommandPrimitive.Dialog 
        open={open} 
        onOpenChange={onOpenChange}
        className="fixed inset-0 z-[100] p-4 pt-[20vh] md:pt-[15vh] bg-black/50 backdrop-blur-sm flex justify-center items-start"
        onClick={(e) => { if(e.target === e.currentTarget) onOpenChange(false); }}
      >
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
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
                        onSelect={() => { onOpenChange(false); navigate('/new'); }}
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
                            onSelect={() => { onOpenChange(false); navigate(`/note/${note.id}`); }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="flex-1 truncate">{note.title || "無標題"}</span>
                            <span className="text-xs text-gray-400 ml-2">
                                {isValid(new Date(note.created_at)) ? new Date(note.created_at).toLocaleDateString() : ''}
                            </span>
                        </CommandPrimitive.Item>
                    ))}
                </CommandPrimitive.Group>
            </CommandPrimitive.List>
        </div>
      </CommandPrimitive.Dialog>
    );
}

// Sidebar: "Smart Sections" instead of just folders
function Sidebar({ notes, service, onLogout, onOpenCmd, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const safeNotes = Array.isArray(notes) ? notes : [];
  
  // Smart Filters
  const recentNotes = useMemo(() => safeNotes.slice(0, 5), [safeNotes]);
  const tags = useMemo(() => {
      const counts = {};
      safeNotes.forEach(n => {
          if (Array.isArray(n.tags)) {
              n.tags.forEach(t => counts[t] = (counts[t] || 0) + 1);
          }
      });
      return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 8);
  }, [safeNotes]);

  const isActive = (path) => location.pathname === path;

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
        {/* Section: Start */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">開始</div>
            <div className="space-y-0.5">
                <SidebarItem icon={HomeIcon} label="首頁" active={isActive('/')} onClick={() => navigate('/')} />
                <SidebarItem icon={Plus} label="新增筆記" onClick={() => navigate('/new')} />
            </div>
        </div>

{/* Section: Browse */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">分類瀏覽</div>
            <div className="space-y-0.5">
                <SidebarItem icon={FolderOpen} label="所有分類" active={isActive('/browse')} onClick={() => navigate('/browse')} />
                <CategoryNav notes={safeNotes} onNavigate={navigate} />
            </div>
        </div>

        {/* Section: Recent */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">近期</div>
            <div className="space-y-0.5">
                {recentNotes.map(note => (
                    <div 
                        key={note.id}
                        onClick={() => navigate(`/note/${note.id}`)}
                        className="group flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 rounded-md cursor-pointer transition-colors"
                    >
                        <FileText size={14} className="text-gray-400 group-hover:text-blue-500" />
                        <span className="truncate">{note.title || "無標題"}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Section: Tags */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">標籤</div>
            <div className="flex flex-wrap gap-1.5 px-1">
                {tags.map(([tag, count]) => (
                    <span key={tag} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 hover:border-blue-300 cursor-pointer">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50/50">
        <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 text-sm w-full hover:bg-red-50 hover:text-red-600 p-2 rounded transition-colors">
          <LogOut size={16} /> 登出
        </button>
      </div>
    </div>
  );
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

function MobileNav({ onOpenCmd }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "text-blue-600" : "text-gray-400";
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix) ? "text-blue-600" : "text-gray-400";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-50">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-0.5 p-2 ${isActive('/')}`}>
        <HomeIcon size={22} />
      </button>
      
      <button onClick={onOpenCmd} className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-gray-900">
        <Search size={22} />
      </button>

      {/* Floating Action Button (FAB) Style Center */}
      <button 
        onClick={() => navigate('/new')} 
        className="mb-8 bg-blue-600 text-white p-3.5 rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
      
      {/* Browse Categories */}
      <button onClick={() => navigate('/browse')} className={`flex flex-col items-center gap-0.5 p-2 ${isActivePrefix('/browse')}`}>
        <Folder size={22} />
      </button>
      
    </div>
  );
}

// Timeline View Home
function Home({ notes, onOpenCmd }) {
  const navigate = useNavigate();
  const safeNotes = Array.isArray(notes) ? notes : [];
  
  // Group notes by time
  const timeline = useMemo(() => {
    const groups = { '今天': [], '昨天': [], '本週': [], '更早': [] };
    
    safeNotes.forEach(note => {
        try {
            const date = parseISO(note.created_at || '');
            if (!isValid(date)) {
                groups['更早'].push(note); // Fallback for invalid dates
                return;
            }
            if (isToday(date)) groups['今天'].push(note);
            else if (isYesterday(date)) groups['昨天'].push(note);
            else if (isThisWeek(date)) groups['本週'].push(note);
            else groups['更早'].push(note);
        } catch (e) {
            groups['更早'].push(note);
        }
    });
    
    return groups;
  }, [safeNotes]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
       {/* Mobile Header */}
       <div className="flex justify-between items-center mb-8 md:hidden">
         <h1 className="text-2xl font-bold text-gray-900">我的筆記</h1>
         <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
            ME
         </div>
       </div>

       {/* Desktop Search Trigger */}
       <div 
         onClick={onOpenCmd}
         className="hidden md:flex items-center gap-3 p-4 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-400 transition-colors group"
       >
         <Search className="text-gray-400 group-hover:text-blue-500" />
         <span className="text-gray-400 text-lg font-light">搜尋筆記...</span>
       </div>

{/* Timeline */}
       <div className="space-y-8">
         {Object.entries(timeline).map(([label, group]) => (
            group.length > 0 && (
                <div key={label} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">{label}</h2>
                    <div className="space-y-3">
                        {group.map(note => (
                            <TimelineCard key={note.id} note={note} onClick={() => navigate(`/note/${note.id}`)} />
                        ))}
                    </div>
                </div>
            )
         ))}
         
         {safeNotes.length === 0 && (
            <div className="text-center py-20 text-gray-400">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Book size={32} className="opacity-20" />
                </div>
                <p>還沒有筆記</p>
                <button onClick={onOpenCmd} className="text-blue-500 text-sm mt-2 hover:underline">開始寫一篇吧</button>
            </div>
         )}
       </div>
    </div>
  );
}

function TimelineCard({ note, onClick }) {
    // Determine icon based on tags/title
    const safeTags = Array.isArray(note.tags) ? note.tags : [];
    const isReport = safeTags.some(t => ['report', 'research', 'deep-dive'].includes(t)) || (note.title || '').includes('Report');
    const isJob = safeTags.some(t => ['career', 'job', 'resume'].includes(t));
    const safeDate = note.created_at ? new Date(note.created_at) : new Date();
    const timeStr = isValid(safeDate) ? format(safeDate, 'HH:mm') : '--:--';
    
    return (
        <div 
            onClick={onClick}
            className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                    {isReport ? <span className="text-purple-500 bg-purple-50 p-1 rounded text-xs font-bold">報告</span> :
                     isJob ? <span className="text-green-600 bg-green-50 p-1 rounded text-xs font-bold">職涯</span> : null}
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {note.title || "無標題"}
                    </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                    {timeStr}
                </span>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                {note.excerpt || "尚無預覽內容..."}
            </p>

            <div className="flex items-center gap-2">
                {safeTags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    )
}

function NoteViewer({ service, notes, onDelete }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!service) return;
    setLoading(true);
    setError(null);

    // 1. Try Local Prop (Optimistic)
    const localNote = notes.find(n => n.id === id);
    if (localNote && localNote.content) {
        setNote(localNote);
        setLoading(false);
        // Continue to fetch fresh content in background if needed, but for now just show local
        return;
    }

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
                setError("筆記內容未找到（可能正在索引中）");
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
                setError("在索引或儲存中找不到筆記");
                setLoading(false);
            });
      }
    }).catch(err => {
        setError("無法載入索引");
        setLoading(false);
    });
  }, [id, service, notes]);

  const handleDelete = async () => {
      if (!confirm("確定要刪除這篇筆記嗎？")) return;
      setDeleting(true);
      try {
          const path = note?.path || `content/${new Date().getFullYear()}/${id}.md`; 
          await service.deleteNote(id, path);
          if (onDelete) onDelete(id);
          navigate('/');
      } catch (e) {
          alert(`刪除失敗：${e.message}`);
      } finally {
          setDeleting(false);
      }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="text-blue-500 underline">重試</button>
    </div>
  );
  if (!note) return <div className="p-8 text-center">找不到筆記</div>;

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
                {deleting ? '刪除中...' : '刪除'}
            </button>
            {!isHtml && (
              <button onClick={() => navigate(`/edit/${id}`)} className="text-blue-600 font-medium text-sm px-3 hover:bg-blue-50 rounded">編輯</button>
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
          <article className="prose prose-slate prose-lg max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {note.content || ''}
            </Markdown>
          </article>
        )}
      </div>
    </div>
  );
}

function NoteEditor({ service, onSave }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [saving, setSaving] = useState(false);
    const [originalCreatedAt, setOriginalCreatedAt] = useState(null);
    const [originalPath, setOriginalPath] = useState(null);

    useEffect(() => {
        if (id) {
             service.getNotesIndex().then(index => {
                const entry = index.find(n => n.id === id);
                if (entry) {
                    setOriginalCreatedAt(entry.created_at);
                    setOriginalPath(entry.path);
                    service.getNote(entry.path).then(n => {
                        setTitle(n.title);
                        setContent(n.content);
                        setTags(Array.isArray(n.tags) ? n.tags.join(', ') : '');
                        if (n.created_at) setOriginalCreatedAt(n.created_at);
                    });
                }
             });
        }
    }, [id, service]);

    const handleSave = async () => {
        if (!title.trim()) return alert("請輸入標題");
        setSaving(true);
        try {
            const noteId = id || crypto.randomUUID();
            const noteData = {
                id: noteId,
                title,
                content,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                created_at: originalCreatedAt || new Date().toISOString(),
                path: originalPath || `content/${new Date().getFullYear()}/${noteId}.md`
            };

            await service.saveNote(noteData);
            
            // Optimistic Update Callback (Updates local state immediately)
            if (onSave) onSave(noteData);
            
            // DO NOT refreshNotes() here! 
            // It will fetch the stale index.json from server and overwrite our new note.
            // refreshNotes(); 
            
            navigate(`/note/${noteId}`);
        } catch (e) {
            console.error(e);
            alert(`儲存失敗：${e.message}`);
        } finally {
            setSaving(false);
        }
    };

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
                
                <div className="flex-1 overflow-auto p-6 md:p-10 w-full bg-white">
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
                        className="w-full h-[calc(100%-200px)] resize-none outline-none text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 font-serif"
                        placeholder="開始寫作..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
