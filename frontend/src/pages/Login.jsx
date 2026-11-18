import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.username, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const quickLogin = async (u, p) => {
    const result = await login(u, p)
    if (result.success) {
      toast.success('Signed in as ' + u)
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl shadow-xl shadow-sky-500/20 mb-4">
            <span className="text-white text-2xl font-black tracking-wider">SCM</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Supply Chain Management</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Enterprise Procurement & AI Analytics Platform</p>
        </div>

        <div className="card shadow-2xl border-slate-700/80">
          <h2 className="text-base font-bold text-white mb-5">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.username || !form.password}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-700/70">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', u: 'admin', p: 'admin123', color: 'hover:border-violet-500/50 hover:bg-violet-500/10 text-violet-400' },
                { label: 'Manager', u: 'manager', p: 'manager123', color: 'hover:border-sky-500/50 hover:bg-sky-500/10 text-sky-400' },
                { label: 'Officer', u: 'officer1', p: 'officer123', color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400' },
              ].map((usr) => (
                <button
                  key={usr.label}
                  type="button"
                  onClick={() => quickLogin(usr.u, usr.p)}
                  disabled={loading}
                  className={`border border-slate-700/80 bg-slate-800/60 rounded-xl py-2 px-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${usr.color}`}
                >
                  {usr.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6 font-medium">
          Secure Enterprise Supply Chain Platform • v2.0
        </p>
      </div>
    </div>
  )
}
