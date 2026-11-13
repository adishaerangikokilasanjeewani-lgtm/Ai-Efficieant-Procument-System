export default function StatCard({ title, value, icon: Icon, color = 'sky', subtitle }) {
  const colors = {
    sky: { bg: 'bg-sky-900/40', icon: 'text-sky-400', border: 'border-sky-800/30' },
    emerald: { bg: 'bg-emerald-900/40', icon: 'text-emerald-400', border: 'border-emerald-800/30' },
    amber: { bg: 'bg-amber-900/40', icon: 'text-amber-400', border: 'border-amber-800/30' },
    red: { bg: 'bg-red-900/40', icon: 'text-red-400', border: 'border-red-800/30' },
    violet: { bg: 'bg-violet-900/40', icon: 'text-violet-400', border: 'border-violet-800/30' },
  }
  const c = colors[color] || colors.sky
  return (
    <div className="card flex items-center gap-4 hover:border-slate-600 transition-colors">
      <div className={`stat-icon ${c.bg} border ${c.border}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
