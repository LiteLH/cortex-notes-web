import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText, Globe } from 'lucide-react'

const FOLDER_LABELS = {
  notes: '筆記', reports: '報告', profile: '個人檔案',
  decisions: '決策', learnings: '學習', memos: '備忘', meetings: '會議', thoughts: '想法',
}

function buildTree(notes) {
  const root = { name: '', children: {}, notes: [] }

  for (const note of notes) {
    const parts = (note.path || '').split('/')
    const fileName = parts.pop()
    let current = root

    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { name: part, children: {}, notes: [] }
      }
      current = current.children[part]
    }
    current.notes.push(note)
  }

  return root
}

function countAll(node) {
  let count = node.notes.length
  for (const child of Object.values(node.children)) {
    count += countAll(child)
  }
  return count
}

function TreeNode({ node, depth = 0, onNoteClick, expandedPaths, toggleExpand }) {
  const hasChildren = Object.keys(node.children).length > 0
  const isExpanded = expandedPaths.has(node._path)
  const totalCount = useMemo(() => countAll(node), [node])

  if (!hasChildren && node.notes.length === 0) return null

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      {/* Folder row */}
      {node.name && (
        <button
          onClick={() => hasChildren && toggleExpand(node._path)}
          className="w-full flex items-center gap-1.5 py-1.5 px-2 text-sm hover:bg-gray-100 rounded-md transition-colors text-left"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          {isExpanded ? <FolderOpen size={16} className="text-blue-500 shrink-0" /> : <Folder size={16} className="text-gray-400 shrink-0" />}
          <span className="flex-1 text-gray-700 truncate">{FOLDER_LABELS[node.name] || node.name}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{totalCount}</span>
        </button>
      )}

      {/* Children (expanded) */}
      {(isExpanded || !node.name) && (
        <div role={hasChildren ? 'group' : undefined}>
          {/* Sub-folders */}
          {Object.entries(node.children)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, child]) => (
              <TreeNode
                key={name}
                node={child}
                depth={node.name ? depth + 1 : depth}
                onNoteClick={onNoteClick}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
              />
            ))}

          {/* Notes in this folder */}
          {node.notes.map(note => (
            <button
              key={note.id}
              onClick={() => onNoteClick?.(note)}
              className="w-full flex items-center gap-1.5 py-1.5 px-2 text-sm hover:bg-blue-50 rounded-md transition-colors text-left group"
              style={{ paddingLeft: `${(node.name ? depth + 1 : depth) * 16 + 8 + 18}px` }}
            >
              {note.format === 'html'
                ? <Globe size={14} className="text-purple-400 shrink-0" />
                : <FileText size={14} className="text-gray-300 group-hover:text-blue-400 shrink-0" />
              }
              <span className="flex-1 text-gray-700 truncate group-hover:text-blue-600">{note.title || '無標題'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ notes, onNoteClick }) {
  const tree = useMemo(() => {
    const t = buildTree(notes || [])
    // Assign _path to each node for expand tracking
    function assignPaths(node, prefix = '') {
      node._path = prefix || '/'
      for (const [name, child] of Object.entries(node.children)) {
        assignPaths(child, prefix ? `${prefix}/${name}` : name)
      }
    }
    assignPaths(t)
    return t
  }, [notes])

  // Default: expand first-level folders
  const [expandedPaths, setExpandedPaths] = useState(() => {
    const initial = new Set()
    if (notes?.length) {
      const t = buildTree(notes)
      for (const name of Object.keys(t.children)) {
        initial.add(name)
      }
    }
    return initial
  })

  const toggleExpand = (path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const expandAll = () => {
    const all = new Set()
    function collect(node) {
      if (node._path) all.add(node._path)
      for (const child of Object.values(node.children)) collect(child)
    }
    collect(tree)
    setExpandedPaths(all)
  }

  const collapseAll = () => setExpandedPaths(new Set())

  if (!notes?.length) {
    return <div className="text-center py-12 text-gray-400">沒有筆記</div>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-2">
        <button onClick={expandAll} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">全部展開</button>
        <span className="text-gray-200">|</span>
        <button onClick={collapseAll} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">全部收合</button>
      </div>
      <div role="tree" aria-label="筆記資料夾結構">
        <TreeNode
          node={tree}
          onNoteClick={onNoteClick}
          expandedPaths={expandedPaths}
          toggleExpand={toggleExpand}
        />
      </div>
    </div>
  )
}
