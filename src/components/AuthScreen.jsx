import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Lock } from 'lucide-react'

export function AuthScreen() {
  const [input, setInput] = useState('')
  const { login, authError } = useAuth()

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
  )
}
