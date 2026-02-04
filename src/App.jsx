import { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { GitHubService } from './lib/github';
import { 
  Book, Plus, Search, Menu, LogOut, Loader2, Save, 
  Home as HomeIcon, FileText, Lock, Folder, Tag, Hash, 
  LayoutGrid, List as ListIcon, Clock, ChevronRight, ChevronDown 
} from 'lucide-react';
import Fuse from 'fuse.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ... (AuthScreen code remains same) ...
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
  const [notes, setNotes] = useState([]); // Centralized notes state

  useEffect(() => {
    if (token) {
      const gh = new GitHubService(token);
      gh.verifyToken().then(res => {
        if (res.valid) {
          setService(gh);
          setIsAuthenticated(true);
          setAuthError(null);
          // Initial Fetch
          gh.getNotesIndex().then(setNotes);
        } else {
          setIsAuthenticated(false);
          setAuthError(res.error || "Invalid token");
        }
      });
    }
  }, [token]);

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
        // Cache busting
        service.getNotesIndex().then(setNotes);
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} error={authError} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
        <Sidebar 
            notes={notes} 
            onLogout={handleLogout} 
            className="hidden md:flex" 
        />
        <main className="flex-1 overflow-auto mb-16 md:mb-0 relative bg-white">
          <Routes>
            <Route path="/" element={<Home notes={notes} refreshNotes={refreshNotes} />} />
            <Route path="/note/:id" element={<NoteViewer service={service} notes={notes} />} />
            <Route path="/new" element={<NoteEditor service={service} refreshNotes={refreshNotes} />} />
            <Route path="/edit/:id" element={<NoteEditor service={service} refreshNotes={refreshNotes} />} />
          </Routes>
        </main>
        <MobileNav refreshNotes={refreshNotes} />
      </div>
    </Router>
  );
}

// Enhanced Sidebar with Folders
function Sidebar({ notes, onLogout, className = "" }) {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState({});

  // 1. Group by Folder
  const structure = useMemo(() => {
    const tree = {};
    notes.forEach(note => {
      // Path example: content/2026/note.md -> Folder: 2026
      const parts = note.path.split('/');
      // Assume structure: content/<folder>/<filename>
      // If path is short, put in root
      let folder = 'Root';
      if (parts.length > 2) {
          folder = parts[1]; // e.g. 2026, inbox
      }
      if (!tree[folder]) tree[folder] = [];
      tree[folder].push(note);
    });
    return tree;
  }, [notes]);

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
        ...prev,
        [folder]: !prev[folder]
    }));
  };

  return (
    <div className={cn("w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full", className)}>
      <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-gray-800">
            <Book className="w-5 h-5 text-blue-600" />
            <span>Cortex Notes</span>
        </div>
        <Link to="/new" className="p-1.5 hover:bg-gray-100 rounded-full text-blue-600 transition-colors">
            <Plus size={20} />
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Object.entries(structure).map(([folder, folderNotes]) => (
            <div key={folder}>
                <button 
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center w-full p-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                    {expandedFolders[folder] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Folder size={16} className="ml-1 mr-2 text-blue-500" />
                    {folder}
                    <span className="ml-auto text-xs text-gray-400">{folderNotes.length}</span>
                </button>
                
                {expandedFolders[folder] && (
                    <div className="ml-4 pl-2 border-l-2 border-gray-200 space-y-0.5 mt-1">
                        {folderNotes.map(note => (
                            <div 
                                key={note.id} 
                                onClick={() => navigate(`/note/${note.id}`)}
                                className="p-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-md cursor-pointer truncate transition-all"
                            >
                                {note.title || "Untitled"}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 text-sm w-full hover:bg-red-50 hover:text-red-600 p-2 rounded transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

function MobileNav({ refreshNotes }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "text-blue-600" : "text-gray-400";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
        <HomeIcon size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </button>
      
      <button onClick={() => navigate('/new')} className="bg-blue-600 text-white p-3 rounded-full -mt-8 shadow-lg border-4 border-gray-50 active:scale-95 transition-transform">
        <Plus size={24} />
      </button>
      
      <button onClick={refreshNotes} className="flex flex-col items-center gap-1 text-gray-400 active:text-blue-600 transition-colors">
        <Book size={24} />
        <span className="text-[10px] font-medium">Sync</span>
      </button>
    </div>
  );
}

function Home({ notes, refreshNotes }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'grid'

  // Fuse.js Search
  const fuse = useMemo(() => new Fuse(notes, {
    keys: ['title', 'tags', 'excerpt'],
    threshold: 0.3,
  }), [notes]);

  const results = useMemo(() => {
    if (!query) return notes;
    return fuse.search(query).map(r => r.item);
  }, [query, notes, fuse]);

  return (
    <div className="p-4 md:p-8 pb-24 max-w-5xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
         <div className="flex gap-2">
            <button onClick={() => setView('list')} className={cn("p-2 rounded", view === 'list' ? "bg-gray-200" : "hover:bg-gray-100")}>
                <ListIcon size={20} />
            </button>
            <button onClick={() => setView('grid')} className={cn("p-2 rounded", view === 'grid' ? "bg-gray-200" : "hover:bg-gray-100")}>
                <LayoutGrid size={20} />
            </button>
         </div>
       </div>

       {/* Search Bar */}
       <div className="relative mb-6">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
         <input 
            type="text" 
            placeholder="Search notes, tags..." 
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
         />
       </div>

       {/* Results */}
       <div className={cn("grid gap-4", view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
        {results.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Book size={48} className="mx-auto mb-4 opacity-20" />
            <p>No notes found.</p>
          </div>
        ) : (
          results.map(note => (
            <div 
              key={note.id} 
              onClick={() => navigate(`/note/${note.id}`)}
              className={cn(
                  "bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]",
                  view === 'grid' ? "rounded-xl p-5 flex flex-col h-48" : "rounded-lg p-4 flex items-center gap-4"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                    {note.title || "Untitled"}
                </div>
                
                {view === 'grid' && (
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3 flex-1">
                        {note.excerpt || "No preview available..."}
                    </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(note.created_at).toLocaleDateString()}
                    </div>
                    {note.tags && note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                            <Hash size={10} /> {tag}
                        </span>
                    ))}
                </div>
              </div>
            </div>
          ))
        )}
       </div>
    </div>
  );
}

function NoteViewer({ service, notes }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimistic Load from Index (Title Only)
  const cachedEntry = useMemo(() => notes.find(n => n.id === id), [notes, id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Always fetch fresh content
    service.getNotesIndex().then(index => {
      const entry = index.find(n => n.id === id);
      if (entry) {
        service.getNote(entry.path)
            .then(n => {
                setNote(n);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load note:", err);
                setError(err.message || "Failed to load note content.");
                setLoading(false);
            });
      } else {
        setError("Note not found in index.");
        setLoading(false);
      }
    }).catch(err => {
        setError("Failed to load index.");
        setLoading(false);
    });
  }, [id, service]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="text-blue-500 underline">Retry</button>
    </div>
  );
  if (!note) return <div className="p-8 text-center">Note not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen pb-24 shadow-sm">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 px-4 py-4 md:px-8">
        <div className="flex justify-between items-start gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{note.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    {note.tags && note.tags.map(t => (
                        <span key={t} className="text-gray-400">#{t}</span>
                    ))}
                </div>
            </div>
            <button 
                onClick={() => navigate(`/edit/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
                <FileText size={20} />
            </button>
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-blue prose-lg max-w-none px-4 py-8 md:px-8">
        {note.content.split('\n').map((line, i) => {
            // ... (Simple Markdown Render Logic) ...
            if (line.startsWith('# ')) return null; // Skip H1 as it's in header
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-gray-800">{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-gray-700">{line.replace('### ', '')}</h3>;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-gray-300">{line.replace('- ', '')}</li>;
            if (line.trim() === '---') return <hr key={i} className="my-8 border-gray-100" />;
            
            // Image handling
            const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                return (
                    <div key={i} className="my-6">
                        <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-xl border border-gray-100 shadow-sm w-full" />
                        {imgMatch[1] && <p className="text-center text-sm text-gray-400 mt-2">{imgMatch[1]}</p>}
                    </div>
                );
            }
            
            // Table handling (basic)
            if (line.includes('|')) return <div key={i} className="overflow-x-auto my-4"><pre className="font-mono text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">{line}</pre></div>;
            
            if (!line.trim()) return <div key={i} className="h-2"></div>;
            return <p key={i} className="mb-3 text-gray-600 leading-relaxed">{line}</p>;
        })}
      </article>
    </div>
  );
}

function NoteEditor({ service, refreshNotes }) {
    // ... (Keep existing Editor logic, just update styling) ...
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
                        setTags(n.tags ? n.tags.join(', ') : '');
                    });
                }
             });
        }
    }, [id, service]);

    const handleSave = async () => {
        if (!title.trim()) return alert("Title is required");
        setSaving(true);
        const noteId = id || crypto.randomUUID();
        const noteData = {
            id: noteId,
            title,
            content,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            created_at: new Date().toISOString(),
        };

        await service.saveNote(noteData);
        setSaving(false);
        refreshNotes(); // Trigger refresh
        navigate(`/note/${noteId}`);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
                <button onClick={() => navigate(-1)} className="text-gray-500">Cancel</button>
                <span className="font-bold text-gray-700">{id ? 'Edit Note' : 'New Note'}</span>
                <button 
                    disabled={saving}
                    onClick={handleSave}
                    className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {saving && <Loader2 className="animate-spin w-3 h-3" />}
                    Save
                </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
                <input 
                    className="w-full text-3xl md:text-4xl font-bold mb-4 outline-none placeholder:text-gray-300" 
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                
                <div className="flex items-center gap-2 text-gray-400 mb-6 border-b border-gray-50 pb-4">
                    <Tag size={16} />
                    <input 
                        className="flex-1 outline-none text-sm placeholder:text-gray-300" 
                        placeholder="Tags (e.g. work, idea)"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                    />
                </div>

                <textarea 
                    className="w-full h-[calc(100vh-300px)] resize-none outline-none text-lg leading-relaxed text-gray-600 placeholder:text-gray-200"
                    placeholder="Start writing..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>
        </div>
    );
}

export default App;
