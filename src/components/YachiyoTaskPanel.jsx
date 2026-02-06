import { useState, useEffect, useMemo } from 'react';
import { Moon, Send, Loader2, CheckCircle, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Timer } from 'lucide-react';

// Parse TASKS.md into structured data
function parseTasksMd(content) {
  const sections = {
    pending: [],
    inProgress: [],
    completed: []
  };
  
  if (!content) return sections;
  
  let currentSection = null;
  let currentTask = null;
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Detect section headers (must start with ##)
    if (line.startsWith('## ')) {
      // Save previous task before switching section
      if (currentTask && currentSection && currentTask.content.trim()) {
        sections[currentSection].push(currentTask);
        currentTask = null;
      }
      
      if (line.includes('待處理') || line.toLowerCase().includes('pending')) {
        currentSection = 'pending';
        continue;
      }
      if (line.includes('進行中') || line.toLowerCase().includes('progress')) {
        currentSection = 'inProgress';
        continue;
      }
      if (line.includes('已完成') || line.toLowerCase().includes('completed') || line.toLowerCase().includes('done')) {
        currentSection = 'completed';
        continue;
      }
    }
    
    // Skip separators and empty content before task
    if (line.startsWith('---') || line.startsWith('# ') || line.startsWith('> ')) {
      continue;
    }
    
    // Detect task headers (### timestamp)
    if (line.startsWith('### ')) {
      // Save previous task before starting new one
      if (currentTask && currentSection && currentTask.content.trim()) {
        sections[currentSection].push(currentTask);
      }
      currentTask = {
        timestamp: line.replace('### ', '').replace('✓', '').replace('✅', '').trim(),
        content: '',
        isCompleted: line.includes('✓') || line.includes('✅')
      };
      continue;
    }
    
    // Accumulate task content (only if we're in a task)
    if (currentTask && currentSection && line.trim() && !line.startsWith('<!--')) {
      currentTask.content += (currentTask.content ? '\n' : '') + line.trim();
    }
  }
  
  // Don't forget the last task
  if (currentTask && currentSection && currentTask.content.trim()) {
    sections[currentSection].push(currentTask);
  }
  
  return sections;
}

// Format TASKS.md content for saving
function formatTasksMd(sections, newTask = null) {
  let content = `# 🌙 八千代任務欄

> 在下面寫任務，我每 5 分鐘會來檢查一次～

---

## 📌 待處理

`;

  // Add new task at the top if provided
  if (newTask) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    content += `### ${timestamp}\n${newTask}\n\n`;
  }

  // Add existing pending tasks
  sections.pending.forEach(task => {
    content += `### ${task.timestamp}\n${task.content}\n\n`;
  });

  content += `---

## ⏳ 進行中

`;

  sections.inProgress.forEach(task => {
    content += `### ${task.timestamp}\n${task.content}\n\n`;
  });

  content += `---

## ✅ 已完成

`;

  sections.completed.forEach(task => {
    content += `### ${task.timestamp} ✓\n${task.content}\n\n`;
  });

  return content;
}

export function YachiyoTaskPanel({ service, compact = false }) {
  const [tasks, setTasks] = useState({ pending: [], inProgress: [], completed: [] });
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sha, setSha] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [nextCheck, setNextCheck] = useState(null);
  const [countdown, setCountdown] = useState('');

  const TASKS_PATH = 'yachiyo/TASKS.md';
  const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // Calculate next check time (approximate, based on 5-min intervals)
  useEffect(() => {
    const calculateNextCheck = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const nextMinute = Math.ceil(minutes / 5) * 5;
      const next = new Date(now);
      next.setMinutes(nextMinute, 0, 0);
      if (next <= now) {
        next.setMinutes(next.getMinutes() + 5);
      }
      setNextCheck(next);
    };

    calculateNextCheck();
    const interval = setInterval(calculateNextCheck, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!nextCheck) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextCheck - now;
      if (diff <= 0) {
        setCountdown('即將檢查...');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${String(secs).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextCheck]);

  // Fetch tasks
  const fetchTasks = async () => {
    if (!service) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const file = await service.getFileContent(TASKS_PATH);
      const parsed = parseTasksMd(file.content);
      setTasks(parsed);
      setSha(file.sha);
      setLastRefresh(new Date());
    } catch (e) {
      if (e.status === 404) {
        // File doesn't exist yet
        setTasks({ pending: [], inProgress: [], completed: [] });
        setSha(null);
      } else {
        setError('無法載入任務欄');
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [service]);

  // Submit new task
  const handleSubmit = async () => {
    if (!newTask.trim() || !service) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const content = formatTasksMd(tasks, newTask.trim());
      
      await service.octokit.rest.repos.createOrUpdateFileContents({
        owner: 'LiteLH',
        repo: 'cortex-notes-db',
        path: TASKS_PATH,
        message: `feat: 新增任務 - ${newTask.slice(0, 50)}...`,
        content: Buffer.from(content).toString('base64'),
        sha: sha || undefined
      });
      
      setNewTask('');
      await fetchTasks(); // Refresh
    } catch (e) {
      setError('儲存失敗，請重試');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const pendingCount = tasks.pending.length + tasks.inProgress.length;
  const completedCount = tasks.completed.length;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={20} />
          <span className="text-indigo-600">載入中...</span>
        </div>
      </div>
    );
  }

  // Compact mode for sidebar
  if (compact) {
    return (
      <div 
        className="group flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer transition-colors"
        onClick={() => {/* Could open a modal */}}
      >
        <Moon size={14} className="text-indigo-400 group-hover:text-indigo-600" />
        <span className="flex-1">八千代任務欄</span>
        {pendingCount > 0 && (
          <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
          <Moon size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white">八千代任務欄</h3>
          <div className="flex items-center gap-2 text-indigo-100 text-xs">
            <Timer size={12} />
            <span>下次檢查：{countdown || '計算中...'}</span>
            {nextCheck && (
              <span className="opacity-70">({nextCheck.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })})</span>
            )}
          </div>
        </div>
        <button 
          onClick={fetchTasks}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="重新整理"
        >
          <RefreshCw size={16} className="text-white" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4">
        <div className="relative">
          <textarea
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="寫點什麼給八千代..."
            className="w-full p-3 pr-12 bg-white border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all text-sm"
            rows={3}
            disabled={saving}
          />
          <button
            onClick={handleSubmit}
            disabled={!newTask.trim() || saving}
            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* Pending Tasks */}
      {tasks.pending.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock size={12} />
            待處理 ({tasks.pending.length})
          </div>
          <div className="space-y-2">
            {tasks.pending.map((task, i) => (
              <TaskCard key={i} task={task} status="pending" />
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {tasks.inProgress.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            進行中 ({tasks.inProgress.length})
          </div>
          <div className="space-y-2">
            {tasks.inProgress.map((task, i) => (
              <TaskCard key={i} task={task} status="inProgress" />
            ))}
          </div>
        </div>
      )}

      {/* Completed (collapsible) */}
      {tasks.completed.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2 hover:text-green-700"
          >
            <CheckCircle size={12} />
            已完成 ({tasks.completed.length})
            {showCompleted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {tasks.completed.slice(0, 5).map((task, i) => (
                <TaskCard key={i} task={task} status="completed" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {pendingCount === 0 && (
        <div className="px-4 pb-4 text-center text-gray-500 text-sm">
          <Moon size={32} className="mx-auto mb-2 text-gray-300" />
          <p>目前沒有任務</p>
          <p className="text-xs text-gray-400">在上方輸入框寫下任務</p>
        </div>
      )}

      {/* Footer */}
      {lastRefresh && (
        <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 text-center">
          上次更新：{lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, status }) {
  const statusStyles = {
    pending: 'bg-white border-gray-200',
    inProgress: 'bg-amber-50 border-amber-200',
    completed: 'bg-green-50 border-green-200 opacity-75'
  };

  return (
    <div className={`p-3 rounded-lg border ${statusStyles[status]} text-sm`}>
      <div className="text-xs text-gray-400 mb-1">{task.timestamp}</div>
      <div className="text-gray-700 whitespace-pre-wrap">{task.content}</div>
    </div>
  );
}

export default YachiyoTaskPanel;
