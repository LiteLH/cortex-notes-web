import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { GitHubService } from './lib/github';
import { Book, Plus, Search, Menu, LogOut, Loader2, Save } from 'lucide-react';

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
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
        <Sidebar service={service} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/note/:id" element={<NoteViewer service={service} />} />
            <Route path="/new" element={<NoteEditor service={service} />} />
            <Route path="/edit/:id" element={<NoteEditor service={service} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function AuthScreen({ onLogin }) {
  const [input, setInput] = useState('');
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
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

function Sidebar({ service, onLogout }) {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    service.getNotesIndex().then(setNotes);
  }, [service]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full hidden md:flex">
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

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <Book size={64} className="mb-4 opacity-20" />
      <p>Select a note or create a new one.</p>
    </div>
  );
}

function NoteViewer({ service }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd lookup the path from context or index
    // For now, we fetch index to find path
    setLoading(true);
    service.getNotesIndex().then(index => {
      const entry = index.find(n => n.id === id);
      if (entry) {
        service.getNote(entry.path).then(n => {
            setNote(n);
            setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [id, service]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!note) return <div className="p-8 text-center">Note not found.</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
        <div className="text-sm text-gray-500 flex gap-2">
           <span>{new Date(note.created_at).toLocaleString()}</span>
           {note.tags && note.tags.map(t => <span key={t} className="bg-gray-100 px-2 rounded-full text-xs">#{t}</span>)}
        </div>
      </div>
      <article className="prose lg:prose-xl">
        <pre className="whitespace-pre-wrap font-sans">{note.content}</pre>
      </article>
      <button 
        onClick={() => navigate(`/edit/${id}`)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
      >
        Edit
      </button>
    </div>
  );
}

function NoteEditor({ service }) {
    const { id } = useParams(); // If present, editing
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
        window.location.reload(); // Quick refresh to update sidebar
    };

    return (
        <div className="p-8 max-w-3xl mx-auto flex flex-col h-full">
            <input 
                className="text-3xl font-bold mb-4 outline-none border-b pb-2" 
                placeholder="Note Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <input 
                className="text-sm text-gray-600 mb-4 outline-none border-b pb-2" 
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
            />
            <textarea 
                className="flex-1 resize-none outline-none text-lg leading-relaxed"
                placeholder="Start typing..."
                value={content}
                onChange={e => setContent(e.target.value)}
            />
            <button 
                disabled={saving}
                onClick={handleSave}
                className="fixed bottom-8 right-8 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2"
            >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saving ? 'Saving...' : 'Save'}
            </button>
        </div>
    );
}

export default App;
