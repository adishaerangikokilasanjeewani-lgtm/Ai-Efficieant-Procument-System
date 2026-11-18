export default function StatCard({ title, value, icon: Icon, color = 'sky', subtitle, trend }) {
  const colorMap = {
    sky: {
      icon: 'text-sky-500 dark:text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-600',
      glow: 'group-hover:border-sky-500/40'
    },
    violet: {
      icon: 'text-violet-500 dark:text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20 text-violet-600',
      glow: 'group-hover:border-violet-500/40'
    },
    emerald: {
      icon: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      glow: 'group-hover:border-emerald-500/40'
    },
    amber: {
      icon: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
      glow: 'group-hover:border-amber-500/40'
    },
    red: {
      icon: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
      glow: 'group-hover:border-rose-500/40'
    },
  }

  const c = colorMap[color] || colorMap.sky

  return (
    <div className={`card group flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200 cursor-default ${c.glow}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg} transition-transform duration-200 group-hover:scale-105`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white tracking-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}
