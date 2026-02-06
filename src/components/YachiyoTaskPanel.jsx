import { useState, useEffect } from 'react';
import { Moon, Send, Loader2, CheckCircle, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Timer, Trash2, FileText } from 'lucide-react';
import { Buffer } from 'buffer';

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
      if (currentTask && currentSection && (currentTask.originalTask || '').trim()) {
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
      if (currentTask && currentSection) {
        sections[currentSection].push(currentTask);
      }
      currentTask = {
        timestamp: line.replace('### ', '').replace('✓', '').replace('✅', '').trim(),
        originalTask: '',
        response: '',
        report: null,
        isCompleted: line.includes('✓') || line.includes('✅')
      };
      continue;
    }
    
    // Extract original task (with strikethrough ~~xxx~~)
    if (currentTask && line.includes('~~')) {
      const match = line.match(/~~(.+?)~~/);
      if (match) {
        currentTask.originalTask = match[1];
      }
      continue;
    }
    
    // Extract response (starts with ✅)
    if (currentTask && (line.startsWith('✅') || line.includes('✅'))) {
      currentTask.response = line.replace('✅', '').trim();
      continue;
    }
    
    // Extract report link (📄 報告：[xxx](yyy))
    if (currentTask && line.includes('📄') && line.includes('報告')) {
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        currentTask.report = {
          title: linkMatch[1],
          path: linkMatch[2]
        };
      }
      continue;
    }
    
    // Accumulate other content
    if (currentTask && currentSection && line.trim() && !line.startsWith('<!--')) {
      // For pending/inProgress, accumulate as content
      if (currentSection !== 'completed') {
        currentTask.originalTask += (currentTask.originalTask ? '\n' : '') + line.trim();
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask && currentSection) {
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
    const taskContent = task.originalTask || task.content || '';
    content += `### ${task.timestamp}\n${taskContent}\n\n`;
  });

  content += `---

## ⏳ 進行中

`;

  sections.inProgress.forEach(task => {
    const taskContent = task.originalTask || task.content || '';
    content += `### ${task.timestamp}\n${taskContent}\n\n`;
  });

  content += `---

## ✅ 已完成

`;

  sections.completed.forEach(task => {
    const taskContent = task.originalTask || '';
    const response = task.response ? `\n✅ ${task.response}` : '';
    const report = task.report ? `\n📄 報告：[${task.report.title}](${task.report.path})` : '';
    content += `### ${task.timestamp} ✓\n~~${taskContent}~~${response}${report}\n\n`;
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
    if (!service) {
      setError('請先登入 GitHub');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const file = await service.getFileContent(TASKS_PATH);
      const parsed = parseTasksMd(file.content);
      setTasks(parsed);
      setSha(file.sha);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('fetchTasks error:', e);
      // Check for 404 in different error formats
      const status = e.status || e.response?.status;
      if (status === 404) {
        // File doesn't exist yet
        setTasks({ pending: [], inProgress: [], completed: [] });
        setSha(null);
      } else {
        setError(`無法載入任務欄: ${e.message || '未知錯誤'}`);
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

  // Delete a single task
  const handleDeleteTask = async (taskToDelete, section) => {
    if (!service) return;
    
    setSaving(true);
    try {
      const newTasks = {
        ...tasks,
        [section]: tasks[section].filter(t => t.timestamp !== taskToDelete.timestamp)
      };
      const content = formatTasksMd(newTasks);
      
      await service.octokit.rest.repos.createOrUpdateFileContents({
        owner: 'LiteLH',
        repo: 'cortex-notes-db',
        path: TASKS_PATH,
        message: `chore: 刪除任務 - ${(taskToDelete.originalTask || '').slice(0, 30)}...`,
        content: Buffer.from(content).toString('base64'),
        sha: sha
      });
      
      await fetchTasks();
    } catch (e) {
      setError('刪除失敗，請重試');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    if (!service || tasks.completed.length === 0) return;
    
    if (!confirm('確定要清除所有已完成的任務嗎？')) return;
    
    setSaving(true);
    try {
      const newTasks = {
        ...tasks,
        completed: []
      };
      const content = formatTasksMd(newTasks);
      
      await service.octokit.rest.repos.createOrUpdateFileContents({
        owner: 'LiteLH',
        repo: 'cortex-notes-db',
        path: TASKS_PATH,
        message: `chore: 清除所有已完成任務`,
        content: Buffer.from(content).toString('base64'),
        sha: sha
      });
      
      await fetchTasks();
    } catch (e) {
      setError('清除失敗，請重試');
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
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs font-semibold text-green-600 uppercase tracking-wider flex items-center gap-2 hover:text-green-700"
            >
              <CheckCircle size={12} />
              已完成 ({tasks.completed.length})
              {showCompleted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showCompleted && tasks.completed.length > 0 && (
              <button
                onClick={() => handleClearCompleted()}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                title="清除所有已完成任務"
              >
                <Trash2 size={12} />
                清除全部
              </button>
            )}
          </div>
          {showCompleted && (
            <div className="space-y-2">
              {tasks.completed.map((task, i) => (
                <TaskCard 
                  key={i} 
                  task={task} 
                  status="completed" 
                  onDelete={() => handleDeleteTask(task, 'completed')}
                  service={service}
                />
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

function TaskCard({ task, status, onDelete, service }) {
  const [expanded, setExpanded] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const statusStyles = {
    pending: 'bg-white border-gray-200',
    inProgress: 'bg-amber-50 border-amber-200',
    completed: 'bg-green-50 border-green-200'
  };

  // Load report content when expanded
  useEffect(() => {
    if (expanded && task.report && !reportContent && service) {
      setLoadingReport(true);
      service.getFileContent(`yachiyo/${task.report.path}`)
        .then(file => {
          setReportContent(file.content);
        })
        .catch(e => {
          console.error('Failed to load report:', e);
          setReportContent('無法載入報告內容');
        })
        .finally(() => setLoadingReport(false));
    }
  }, [expanded, task.report, reportContent, service]);

  // Determine what to display
  const displayTask = task.originalTask || task.content || '';
  const hasResponse = task.response || task.report;

  return (
    <div className={`rounded-lg border ${statusStyles[status]} text-sm overflow-hidden group`}>
      {/* Header - always visible */}
      <div 
        className={`p-3 ${hasResponse && status === 'completed' ? 'cursor-pointer hover:bg-green-100/50' : ''}`}
        onClick={() => hasResponse && status === 'completed' && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
              {task.timestamp}
              {hasResponse && status === 'completed' && (
                <span className="text-green-600">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              )}
            </div>
            <div className="text-gray-700">{displayTask}</div>
          </div>
          
          {/* Delete button */}
          {status === 'completed' && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              title="刪除此任務"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded content - response and report */}
      {expanded && status === 'completed' && (
        <div className="border-t border-green-200 bg-green-50/50 p-3 space-y-3">
          {/* Response */}
          {task.response && (
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-xs text-green-600 font-semibold mb-1 flex items-center gap-1">
                <Moon size={12} />
                八千代回覆
              </div>
              <div className="text-gray-700 text-sm">{task.response}</div>
            </div>
          )}
          
          {/* Report content */}
          {task.report && (
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <div className="text-xs text-indigo-600 font-semibold mb-2 flex items-center gap-1">
                <FileText size={12} />
                {task.report.title}
              </div>
              {loadingReport ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  載入中...
                </div>
              ) : reportContent ? (
                <div className="text-gray-600 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto prose prose-sm">
                  {reportContent}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default YachiyoTaskPanel;
