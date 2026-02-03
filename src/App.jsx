import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { GitHubService } from './lib/github';
import { Book, Plus, Search, Menu, LogOut, Loader2, Save, Home as HomeIcon, FileText } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [service, setService] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (token) {
      const gh = new GitHubService(token);
      gh.verifyToken().then(res => {
        if (res.valid) {
          setService(gh);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      });
    }
  }, [token]);

  const handleLogin = (t) => {
    localStorage.setItem('gh_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_token');
    setToken('');
    setService(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar service={service} onLogout={handleLogout} className="hidden md:flex" />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto mb-16 md:mb-0">
          <Routes>
            <Route path="/" element={<Home service={service} />} />
            <Route path="/note/:id" element={<NoteViewer service={service} />} />
            <Route path="/new" element={<NoteEditor service={service} />} />
            <Route path="/edit/:id" element={<NoteEditor service={service} />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </Router>
  );
}

function AuthScreen({ onLogin }) {
  const [input, setInput] = useState('');
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Book className="text-blue-600" /> Cortex Notes
        </h1>
        <p className="mb-4 text-gray-600">Enter your GitHub Personal Access Token (PAT) to access your private notes.</p>
        <input 
          type="password" 
          className="w-full p-2 border rounded mb-4" 
          placeholder="ghp_..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button 
          onClick={() => onLogin(input)}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

function Sidebar({ service, onLogout, className = "" }) {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    service.getNotesIndex().then(setNotes);
  }, [service]);

  return (
    <div className={`w-64 bg-white border-r border-gray-200 flex flex-col h-full ${className}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-lg">My Notes</h2>
        <Link to="/new" className="p-1 hover:bg-gray-100 rounded"><Plus size={20} /></Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm text-center">No notes found.</div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => navigate(`/note/${note.id}`, { state: { path: note.path } })}
              className="p-3 border-b hover:bg-blue-50 cursor-pointer"
            >
              <div className="font-medium truncate">{note.title}</div>
              <div className="text-xs text-gray-500 truncate">{new Date(note.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t">
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 text-sm w-full hover:bg-red-50 p-2 rounded">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? "text-blue-600" : "text-gray-500";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50 shadow-lg">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center ${isActive('/')}`}>
        <HomeIcon size={24} />
        <span className="text-xs mt-1">Home</span>
      </button>
      <button onClick={() => navigate('/new')} className="bg-blue-600 text-white p-3 rounded-full -mt-8 shadow-lg border-4 border-gray-50">
        <Plus size={24} />
      </button>
      <button onClick={() => window.location.reload()} className="flex flex-col items-center text-gray-500">
        <Book size={24} />
        <span className="text-xs mt-1">Reload</span>
      </button>
    </div>
  );
}

// Mobile Home: Show List of Notes
function Home({ service }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    service.getNotesIndex().then(data => {
        setNotes(data);
        setLoading(false);
    });
  }, [service]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 md:hidden">
       <h1 className="text-2xl font-bold mb-4">My Notes</h1>
       <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <Book size={48} className="mx-auto mb-2 opacity-20" />
            <p>No notes yet. Tap + to create one.</p>
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => navigate(`/note/${note.id}`)}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <div className="font-bold text-lg mb-1">{note.title}</div>
              <div className="text-xs text-gray-500 mb-2">{new Date(note.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{note.excerpt}</div>
            </div>
          ))
        )}
       </div>
    </div>
  );
}

function NoteViewer({ service }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="text-blue-500 underline">Retry</button>
    </div>
  );
  if (!note) return <div className="p-8 text-center">Note not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{note.title}</h1>
        <div className="text-sm text-gray-500 flex gap-2 flex-wrap">
           <span>{new Date(note.created_at).toLocaleString()}</span>
           {note.tags && note.tags.map(t => <span key={t} className="bg-gray-100 px-2 rounded-full text-xs">#{t}</span>)}
        </div>
      </div>
      <article className="prose lg:prose-xl max-w-none">
        {/* Simple markdown renderer */}
        {note.content.split('\n').map((line, i) => {
            // Headers
            if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.replace('# ', '')}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-3">{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
            
            // Images: ![alt](url)
            const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                return (
                    <div key={i} className="my-4">
                        <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg shadow-md max-w-full" />
                        {imgMatch[1] && <p className="text-sm text-gray-500 mt-1 text-center">{imgMatch[1]}</p>}
                    </div>
                );
            }

            // Tables (simple rendering)
            if (line.includes('|')) return <pre key={i} className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-2 rounded overflow-x-auto">{line}</pre>;

            // Separator
            if (line.trim() === '---') return <hr key={i} className="my-6 border-gray-300" />;

            // Empty lines
            if (!line.trim()) return <div key={i} className="h-4"></div>;

            // Default text
            return <p key={i} className="mb-2">{line}</p>;
        })}
      </article>
      <button 
        onClick={() => navigate(`/edit/${id}`)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        <FileText />
      </button>
    </div>
  );
}

function NoteEditor({ service }) {
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
        navigate(`/note/${noteId}`);
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col h-full pb-24">
            <input 
                className="text-2xl md:text-3xl font-bold mb-4 outline-none border-b pb-2 bg-transparent" 
                placeholder="Note Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <input 
                className="text-sm text-gray-600 mb-4 outline-none border-b pb-2 bg-transparent" 
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
            />
            <textarea 
                className="flex-1 resize-none outline-none text-base md:text-lg leading-relaxed bg-transparent"
                placeholder="Start typing..."
                value={content}
                onChange={e => setContent(e.target.value)}
            />
            <button 
                disabled={saving}
                onClick={handleSave}
                className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2 z-50"
            >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saving ? 'Saving...' : 'Save'}
            </button>
        </div>
    );
}

export default App;
