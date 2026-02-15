import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Folder, FileText, ChevronRight, Briefcase, Cpu, Wrench, BookOpen, Calendar, Inbox, Archive } from 'lucide-react';
import { useNotes } from '../contexts/NotesContext.jsx';

// 分類定義
const CATEGORIES = {
  'areas': {
    label: '📁 領域',
    description: '長期關注領域',
    icon: Folder,
    color: 'blue',
    subcategories: {
      'career': { label: '💼 職涯', icon: Briefcase },
      'hardware': { label: '🔧 硬體', icon: Cpu },
      'ai-tools': { label: '🤖 AI 工具', icon: Wrench },
    }
  },
  'projects': {
    label: '🚀 專案',
    description: '專案',
    icon: Folder,
    color: 'green',
    subcategories: {}
  },
  'resources': {
    label: '📚 資源',
    description: '參考資料',
    icon: BookOpen,
    color: 'purple',
    subcategories: {
      'tutorials': { label: '📖 教學', icon: BookOpen },
      'cheatsheets': { label: '📋 速查表', icon: FileText },
      'templates': { label: '📄 模板', icon: FileText },
    }
  },
  'journal': {
    label: '📅 日誌',
    description: '日誌',
    icon: Calendar,
    color: 'orange',
    subcategories: {}
  },
'inbox': {
    label: '📥 收件匣',
    description: '未分類',
    icon: Inbox,
    color: 'gray',
    subcategories: {}
  },
  'content': {
    label: '📦 舊內容',
    description: '待整理',
    icon: Archive,
    color: 'gray',
    subcategories: {}
  },
};

// 從路徑解析分類
export function getCategoryFromPath(path) {
  if (!path) return { category: 'content', subcategory: null };
  
  const parts = path.split('/');
  const category = parts[0];
  const subcategory = parts.length > 2 ? parts[1] : null;
  
  return { category, subcategory };
}

// 分類瀏覽頁面
export function CategoryBrowser() {
  const navigate = useNavigate();
  const { category, subcategory } = useParams();
  const { notes } = useNotes();

  const safeNotes = Array.isArray(notes) ? notes : [];
  
  // 按分類組織筆記
  const notesByCategory = useMemo(() => {
    const result = {};
    
    safeNotes.forEach(note => {
      const { category: cat, subcategory: sub } = getCategoryFromPath(note.path);
      
      if (!result[cat]) result[cat] = { notes: [], subcategories: {} };
      
      if (sub) {
        if (!result[cat].subcategories[sub]) result[cat].subcategories[sub] = [];
        result[cat].subcategories[sub].push(note);
      } else {
        result[cat].notes.push(note);
      }
    });
    
    return result;
  }, [safeNotes]);
  
  // 如果有選擇分類，顯示該分類的筆記
  if (category) {
    const catData = notesByCategory[category] || { notes: [], subcategories: {} };
    const catInfo = CATEGORIES[category] || { label: category, icon: Folder };
    
    let displayNotes = [];
    let title = catInfo.label;
    
    if (subcategory) {
      displayNotes = catData.subcategories[subcategory] || [];
      const subInfo = catInfo.subcategories?.[subcategory] || { label: subcategory };
      title = `${catInfo.label} / ${subInfo.label}`;
    } else {
      displayNotes = [...catData.notes];
      Object.values(catData.subcategories).forEach(notes => {
        displayNotes.push(...notes);
      });
    }
    
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/browse')}
            className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1"
          >
            ← 返回分類
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{displayNotes.length} 個筆記</p>
        </div>
        
        {!subcategory && Object.keys(catData.subcategories).length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(catData.subcategories).map(([sub, subNotes]) => {
              const subInfo = catInfo.subcategories?.[sub] || { label: sub, icon: Folder };
              const SubIcon = subInfo.icon || Folder;
              return (
                <button
                  key={sub}
                  onClick={() => navigate(`/browse/${category}/${sub}`)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <SubIcon size={16} className="text-gray-400" />
                  <span className="text-sm">{subInfo.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{subNotes.length}</span>
                </button>
              );
            })}
          </div>
        )}
        
        <div className="space-y-2">
          {displayNotes.map(note => (
            <div
              key={note.id}
              onClick={() => navigate(`/note/${note.id}`)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition"
            >
              <FileText size={18} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{note.title || '無標題'}</div>
                <div className="text-xs text-gray-400">{note.path}</div>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
          
          {displayNotes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              這個分類還沒有筆記
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 顯示所有分類概覽
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📂 分類瀏覽</h1>
        <p className="text-gray-500 text-sm mt-1">按主題整理的筆記</p>
      </div>
      
      <div className="grid gap-4">
        {Object.entries(CATEGORIES).map(([key, catInfo]) => {
          const catData = notesByCategory[key] || { notes: [], subcategories: {} };
          const totalNotes = catData.notes.length + 
            Object.values(catData.subcategories).reduce((sum, arr) => sum + arr.length, 0);
          
          if (totalNotes === 0 && key !== 'inbox') return null;
          
          const Icon = catInfo.icon;
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
            green: 'bg-green-50 border-green-200 hover:border-green-400',
            purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
            orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
            indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
            gray: 'bg-gray-50 border-gray-200 hover:border-gray-400',
          };
          
          return (
            <div
              key={key}
              onClick={() => navigate(`/browse/${key}`)}
              className={`p-4 border rounded-xl cursor-pointer transition ${colorClasses[catInfo.color] || colorClasses.gray}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={24} className="text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{catInfo.label}</div>
                    <div className="text-sm text-gray-500">{catInfo.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-700">{totalNotes}</span>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
              
              {Object.keys(catData.subcategories).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.entries(catData.subcategories).slice(0, 4).map(([sub, subNotes]) => (
                    <span key={sub} className="text-xs bg-white/50 px-2 py-1 rounded">
                      {sub} ({subNotes.length})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 側邊欄分類導航組件
export function CategoryNav({ notes, onNavigate }) {
  const safeNotes = Array.isArray(notes) ? notes : [];
  
  const counts = useMemo(() => {
    const result = {};
    safeNotes.forEach(note => {
      const { category } = getCategoryFromPath(note.path);
      result[category] = (result[category] || 0) + 1;
    });
    return result;
  }, [safeNotes]);
  
  const mainCategories = ['areas', 'projects', 'resources'];
  
  return (
    <div className="space-y-1">
      {mainCategories.map(key => {
        const catInfo = CATEGORIES[key];
        if (!catInfo) return null;
        const count = counts[key] || 0;
        
        return (
          <button
            key={key}
            onClick={() => onNavigate(`/browse/${key}`)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
          >
            <span>{catInfo.label}</span>
            {count > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryBrowser;
