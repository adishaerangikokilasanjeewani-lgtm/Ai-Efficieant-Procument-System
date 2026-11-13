import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.username, form.password)
    if (result.success) { toast.success('Welcome back!'); navigate('/') }
    else toast.error(result.error)
  }

  const quickLogin = async (u, p) => {
    const result = await login(u, p)
    if (result.success) { toast.success('Logged in!'); navigate('/') }
    else toast.error(result.error)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-600 rounded-2xl shadow-xl mb-4">
            <span className="text-white text-2xl font-bold">EP</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Efficient Procurement</h1>
          <p className="text-slate-400 mt-1">AI-Powered Supply Chain Management</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input type="text" className="input" placeholder="Enter username" value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type={showPw ? 'text' : 'password'} className="input" placeholder="Enter password"
                value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', u: 'admin', p: 'admin123', cls: 'bg-violet-900/30 text-violet-400 border border-violet-800/50 hover:bg-violet-900/50' },
                { label: 'Manager', u: 'manager', p: 'manager123', cls: 'bg-sky-900/30 text-sky-400 border border-sky-800/50 hover:bg-sky-900/50' },
                { label: 'Officer', u: 'officer1', p: 'officer123', cls: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50' },
              ].map((usr) => (
                <button key={usr.label} onClick={() => quickLogin(usr.u, usr.p)} disabled={loading}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${usr.cls}`}>
                  {usr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-4">Demo Version • Sample Data Only</p>
      </div>
    </div>
  )
}
