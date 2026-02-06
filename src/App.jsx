import { useState, useEffect, useMemo, useRef, Component } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { GitHubService } from './lib/github';
import { YachiyoTaskPanel } from './components/YachiyoTaskPanel';
import { 
  Book, Plus, Search, Menu, LogOut, Loader2, Save, 
  Home as HomeIcon, FileText, Lock, Folder, Tag, Hash, 
  LayoutGrid, List as ListIcon, Clock, ChevronRight, ChevronDown,
  Command, Calendar, ArrowRight, Star, Moon
} from 'lucide-react';
import Fuse from 'fuse.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isThisWeek, parseISO, isValid } from 'date-fns';
import { Command as CommandPrimitive } from 'cmdk';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ... (AuthScreen remains same) ...
function AuthScreen({ onLogin, error }) {
  const [input, setInput] = useState('');
  
  return (
    <div className="flex min-h-screen bg-gray-100 p-4 justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <Lock size={48} className="mx-auto mb-2 opacity-90" />
          <h1 className="text-2xl font-bold">Private Access</h1>
          <p className="text-blue-100 text-sm mt-1">Unlock your Cortex Notebook</p>
        </div>
        
        <div className="p-8">
          <div className="mb-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="font-semibold mb-1">Why do I need this?</p>
            <p>Your notes are stored in a <strong>Private GitHub Repository</strong> for security. To view them, you need to provide a Personal Access Token (PAT).</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {error}
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
            onClick={() => onLogin(input)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md active:transform active:scale-95"
          >
            Unlock Notebook
          </button>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Token is stored locally in your browser.</p>
            <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 inline-block">
              Generate a new token (Classic) &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [service, setService] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [openCmd, setOpenCmd] = useState(false); // Command Palette State

  useEffect(() => {
    if (token) {
      const gh = new GitHubService(token);
      gh.verifyToken().then(res => {
        if (res.valid) {
          setService(gh);
          setIsAuthenticated(true);
          setAuthError(null);
          gh.getNotesIndex().then(data => {
              // Safety: Ensure created_at exists and is valid before sorting
              const safeData = (data || []).map(n => ({
                  ...n,
                  created_at: n.created_at || new Date().toISOString()
              }));
              
              const sorted = safeData.sort((a, b) => {
                  const dateA = new Date(a.created_at);
                  const dateB = new Date(b.created_at);
                  return (isValid(dateB) ? dateB : new Date()) - (isValid(dateA) ? dateA : new Date());
              });
              setNotes(sorted);
          });
        } else {
          setIsAuthenticated(false);
          setAuthError(res.error || "Invalid token");
        }
      });
    }
  }, [token]);

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

  const handleLogin = (t) => {
    if (!t.trim()) {
        setAuthError("Token cannot be empty");
        return;
    }
    localStorage.setItem('gh_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_token');
    setToken('');
    setService(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setNotes([]);
  };

  const refreshNotes = () => {
    if (service) {
        service.getNotesIndex().then(data => {
            const safeData = (data || []).map(n => ({
                  ...n,
                  created_at: n.created_at || new Date().toISOString()
            }));
            const sorted = safeData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setNotes(sorted);
        });
    }
  };

  const handleSaveNote = (newNote) => {
      setNotes(prev => {
          const filtered = prev.filter(n => n.id !== newNote.id);
          return [newNote, ...filtered];
      });
  };

  const handleDeleteNote = (id) => {
      setNotes(prev => prev.filter(n => n.id !== id));
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} error={authError} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row overflow-hidden">
        <Sidebar 
            notes={notes} 
            service={service}
            onLogout={handleLogout} 
            onOpenCmd={() => setOpenCmd(true)}
            className="hidden md:flex" 
        />
        <main className="flex-1 overflow-auto mb-16 md:mb-0 relative bg-white md:bg-gray-50/50">
            <Routes>
              <Route path="/" element={<Home notes={notes} service={service} refreshNotes={refreshNotes} onOpenCmd={() => setOpenCmd(true)} />} />
              <Route path="/yachiyo" element={<YachiyoPage service={service} />} />
              <Route path="/note/:id" element={<NoteViewer service={service} notes={notes} onDelete={handleDeleteNote} />} />
              <Route path="/new" element={<NoteEditor service={service} onSave={handleSaveNote} refreshNotes={refreshNotes} />} />
              <Route path="/edit/:id" element={<NoteEditor service={service} onSave={handleSaveNote} refreshNotes={refreshNotes} />} />
            </Routes>
        </main>
        <MobileNav refreshNotes={refreshNotes} onOpenCmd={() => setOpenCmd(true)} />
        
        {/* Global Command Palette */}
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
                    placeholder="Search notes, commands, tags..." 
                    className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    autoFocus
                />
            </div>
            <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto p-2">
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-gray-500">No results found.</CommandPrimitive.Empty>
                
                <CommandPrimitive.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                    <CommandPrimitive.Item 
                        className="flex cursor-default select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-blue-50 aria-selected:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onSelect={() => { onOpenChange(false); navigate('/new'); }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create New Note</span>
                    </CommandPrimitive.Item>
                </CommandPrimitive.Group>

                <CommandPrimitive.Group heading="Recent Notes" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                    {safeNotes.slice(0, 10).map(note => (
                        <CommandPrimitive.Item 
                            key={note.id}
                            className="flex cursor-default select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-blue-50 aria-selected:text-blue-700"
                            onSelect={() => { onOpenChange(false); navigate(`/note/${note.id}`); }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="flex-1 truncate">{note.title || "Untitled"}</span>
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
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono text-gray-400">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        {/* Section: Start */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Start</div>
            <div className="space-y-0.5">
                <SidebarItem icon={HomeIcon} label="Home" active={isActive('/')} onClick={() => navigate('/')} />
                <SidebarItem icon={Plus} label="New Note" onClick={() => navigate('/new')} />
            </div>
        </div>

        {/* Section: Yachiyo */}
        <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 px-2">🌙 八千代</div>
            <div className="space-y-0.5">
                <SidebarItem icon={Moon} label="任務欄" active={isActive('/yachiyo')} onClick={() => navigate('/yachiyo')} />
            </div>
        </div>

        {/* Section: Recent */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent</div>
            <div className="space-y-0.5">
                {recentNotes.map(note => (
                    <div 
                        key={note.id}
                        onClick={() => navigate(`/note/${note.id}`)}
                        className="group flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 rounded-md cursor-pointer transition-colors"
                    >
                        <FileText size={14} className="text-gray-400 group-hover:text-blue-500" />
                        <span className="truncate">{note.title || "Untitled"}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Section: Tags */}
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Tags</div>
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
          <LogOut size={16} /> Logout
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

function MobileNav({ refreshNotes, onOpenCmd }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "text-blue-600" : "text-gray-400";

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
      
      <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-gray-900">
        <Folder size={22} />
      </button>
      
      <button onClick={refreshNotes} className="flex flex-col items-center gap-0.5 p-2 text-gray-400 hover:text-gray-900 active:animate-spin">
        <Clock size={22} />
      </button>
    </div>
  );
}

// Yachiyo Task Page
function YachiyoPage({ service }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">🌙</span> 八千代任務欄
        </h1>
        <p className="text-gray-500 text-sm mt-1">在這裡寫下任務，八千代會自動執行</p>
      </div>
      <YachiyoTaskPanel service={service} />
    </div>
  );
}

// Timeline View Home
function Home({ notes, service, onOpenCmd }) {
  const navigate = useNavigate();
  const safeNotes = Array.isArray(notes) ? notes : [];
  
  // Group notes by time
  const timeline = useMemo(() => {
    const groups = { Today: [], Yesterday: [], ThisWeek: [], Older: [] };
    
    safeNotes.forEach(note => {
        try {
            const date = parseISO(note.created_at || '');
            if (!isValid(date)) {
                groups.Older.push(note); // Fallback for invalid dates
                return;
            }
            if (isToday(date)) groups.Today.push(note);
            else if (isYesterday(date)) groups.Yesterday.push(note);
            else if (isThisWeek(date)) groups.ThisWeek.push(note);
            else groups.Older.push(note);
        } catch (e) {
            groups.Older.push(note);
        }
    });
    
    return groups;
  }, [safeNotes]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
       {/* Mobile Header */}
       <div className="flex justify-between items-center mb-8 md:hidden">
         <h1 className="text-2xl font-bold text-gray-900">Stream</h1>
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
         <span className="text-gray-400 text-lg font-light">What's on your mind?</span>
       </div>

       {/* Yachiyo Quick Card */}
       <div 
         onClick={() => navigate('/yachiyo')}
         className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:shadow-indigo-200 transition-all group"
       >
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
             <Moon size={20} className="text-white" />
           </div>
           <div className="flex-1">
             <h3 className="font-bold text-white">🌙 八千代任務欄</h3>
             <p className="text-indigo-100 text-sm">點擊寫任務，自動執行</p>
           </div>
           <ArrowRight className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
         </div>
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
                <p>No thoughts yet.</p>
                <button onClick={onOpenCmd} className="text-blue-500 text-sm mt-2 hover:underline">Start writing</button>
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
                    {isReport ? <span className="text-purple-500 bg-purple-50 p-1 rounded text-xs font-bold">REPORT</span> :
                     isJob ? <span className="text-green-600 bg-green-50 p-1 rounded text-xs font-bold">CAREER</span> : null}
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {note.title || "Untitled"}
                    </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                    {timeStr}
                </span>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                {note.excerpt || "No preview content available..."}
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
        service.getNote(path)
            .then(n => {
                setNote(n);
                setLoading(false);
            })
            .catch(err => {
                console.warn("Standard fetch failed, trying direct content fetch...", err);
                // Try fallback strategies or show error
                setError("Note content not found (yet). It might be indexing.");
                setLoading(false);
            });
      } else {
        // Strategy 3: Blind Fetch (If not in index and not in local)
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
  }, [id, service, notes]);

  const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this note?")) return;
      setDeleting(true);
      try {
          const path = note?.path || `content/${new Date().getFullYear()}/${id}.md`; 
          await service.deleteNote(id, path);
          if (onDelete) onDelete(id);
          navigate('/');
      } catch (e) {
          alert(`Failed to delete: ${e.message}`);
      } finally {
          setDeleting(false);
      }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="text-blue-500 underline">Retry</button>
    </div>
  );
  if (!note) return <div className="p-8 text-center">Note not found.</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white min-h-screen pb-24 md:my-8 md:rounded-2xl md:shadow-sm md:border border-gray-100">
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
            <button onClick={() => navigate(`/edit/${id}`)} className="text-blue-600 font-medium text-sm px-3 hover:bg-blue-50 rounded">Edit</button>
        </div>
      </div>

      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{note.title}</h1>
        <div className="flex flex-wrap gap-2 mb-8">
            {Array.isArray(note.tags) && note.tags.map(t => (
                <span key={t} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#{t}</span>
            ))}
            <span className="text-xs text-gray-400 py-1 ml-auto">
                {new Date(note.created_at).toLocaleString()}
            </span>
        </div>

        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600">
            {(note.content || '').split('\n').map((line, i) => {
                if (line.startsWith('# ')) return null; 
                if (line.trim() === '---') return <hr key={i} className="border-gray-100" />;
                if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-blue-200 pl-4 italic text-gray-600">{line.replace('> ', '')}</blockquote>;
                if (line.startsWith('```')) return null; 
                return <p key={i} className="mb-4 text-gray-700 leading-7">{line}</p>;
            })}
        </article>
      </div>
    </div>
  );
}

function NoteEditor({ service, refreshNotes, onSave }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
             service.getNotesIndex().then(index => {
                const entry = index.find(n => n.id === id);
                if (entry) {
                    service.getNote(entry.path).then(n => {
                        setTitle(n.title);
                        setContent(n.content);
                        setTags(Array.isArray(n.tags) ? n.tags.join(', ') : '');
                    });
                }
             });
        }
    }, [id, service]);

    const handleSave = async () => {
        if (!title.trim()) return alert("Title is required");
        setSaving(true);
        try {
            const noteId = id || crypto.randomUUID();
            const noteData = {
                id: noteId,
                title,
                content,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                created_at: new Date().toISOString(),
                path: `content/${new Date().getFullYear()}/${noteId}.md`
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
            alert(`Failed to save: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white md:bg-gray-50/50">
            <div className="md:max-w-3xl md:mx-auto md:my-8 md:bg-white md:rounded-2xl md:shadow-sm md:border border-gray-100 w-full h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">Cancel</button>
                    <button 
                        disabled={saving}
                        onClick={handleSave}
                        className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold shadow-md shadow-gray-200 flex items-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-all"
                    >
                        {saving && <Loader2 className="animate-spin w-3 h-3" />}
                        Save
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 md:p-10 w-full bg-white">
                    <input 
                        className="w-full text-3xl md:text-4xl font-bold mb-6 outline-none placeholder:text-gray-200" 
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    
                    <div className="flex items-center gap-3 text-gray-400 mb-8 border-b border-gray-50 pb-4">
                        <Tag size={18} />
                        <input 
                            className="flex-1 outline-none text-base placeholder:text-gray-300" 
                            placeholder="Tags (comma separated)"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>

                    <textarea 
                        className="w-full h-[calc(100%-200px)] resize-none outline-none text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 font-serif"
                        placeholder="Start writing..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
