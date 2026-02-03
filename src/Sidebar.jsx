      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm text-center">No notes found.</div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => {
                  navigate(`/note/${note.id}`);
                  // Also refresh sidebar active state if we had one
              }}
              className="p-3 border-b hover:bg-blue-50 cursor-pointer"
            >
              <div className="font-medium truncate">{note.title}</div>
              <div className="text-xs text-gray-500 truncate">{new Date(note.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>