import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import {
  LayoutDashboard, Package, Truck, ShoppingCart, Brain,
  BarChart3, Menu, X, Shield, LogOut
} from 'lucide-react'

const navGroups = [
  {
    title: 'Operations',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/products', icon: Package, label: 'Products & Inventory' },
      { to: '/suppliers', icon: Truck, label: 'Suppliers' },
      { to: '/orders', icon: ShoppingCart, label: 'Purchase Orders' },
    ]
  },
  {
    title: 'AI Intelligence',
    items: [
      { to: '/ai/forecast', icon: Brain, label: 'AI Demand Forecast' },
      { to: '/ai/risk', icon: Shield, label: 'Supplier Risk' },
      { to: '/ai/spend', icon: BarChart3, label: 'Spend Analysis' },
    ]
  }
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SC'

  return (
    <aside className={`${
      collapsed ? 'w-16' : 'w-64'
    } bg-slate-900 border-r border-slate-700/80 flex flex-col transition-all duration-300 min-h-screen flex-shrink-0 z-20`}>
      {/* Header Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/80 h-16">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20">
              <span className="text-white text-xs font-black tracking-wider">SCM</span>
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm tracking-tight">Supply Chain</p>
              <p className="text-sky-400 text-xs font-medium">Management</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {!collapsed && <ThemeToggle />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
            )}
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm group ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-600/20 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`
                }
                title={collapsed ? label : ''}
              >
                <Icon size={18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-105" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Profile & Logout */}
      <div className="p-3 border-t border-slate-700/80 space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/70 rounded-xl border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-[11px] capitalize truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border hover:border-rose-500/20 text-sm font-medium transition-all duration-150 cursor-pointer"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
