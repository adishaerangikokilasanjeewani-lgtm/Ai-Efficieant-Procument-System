import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, Truck, ShoppingCart, Brain,
  BarChart3, Menu, X, Shield
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products & Inventory' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { to: '/ai/forecast', icon: Brain, label: 'AI Demand Forecast' },
  { to: '/ai/risk', icon: Shield, label: 'Supplier Risk' },
  { to: '/ai/spend', icon: BarChart3, label: 'Spend Analysis' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()

  return (
    <aside className={`${
      collapsed ? 'w-16' : 'w-64'
    } bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300 min-h-screen flex-shrink-0`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">EP</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Efficient</p>
              <p className="text-sky-400 text-xs">Procurement</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            } title={collapsed ? label : ''}>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700">
        {!collapsed && (
          <div className="mb-2 px-3 py-2 bg-slate-800 rounded-lg">
            <p className="text-white text-xs font-medium">{user?.full_name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        )}
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-400 hover:bg-red-900/30 hover:text-red-400 text-sm">
          <span className="flex-shrink-0">⎋</span>
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
