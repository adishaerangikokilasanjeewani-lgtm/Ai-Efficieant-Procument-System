import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary, getMonthlySpend, getLowStock, getAiInsights } from '../services/api'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingCart, Truck, Package, AlertTriangle, TrendingUp, Clock, CheckCircle, Brain, Star, ArrowRight, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const statusCls = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  received: 'badge-received',
  cancelled: 'badge-cancelled',
  ordered: 'badge-approved'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getMonthlySpend(), getLowStock(), getAiInsights()])
      .then(([s, ms, ls, ai]) => {
        setSummary(s.data)
        setMonthly(ms.data.slice(-12))
        setLowStock(ls.data)
        setInsights(ai.data)
      }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />

  const fmt = (n) => `LKR ${(n / 1000000).toFixed(2)}M`
  const fmtK = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(Math.round(n))

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'} 👋`}
        subtitle="Here's what's happening across your procurement and supply chain operations today."
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spend" value={fmt(summary?.total_spend || 0)} icon={TrendingUp} color="sky" subtitle="All-time approved orders" />
        <StatCard title="This Month" value={fmt(summary?.monthly_spend || 0)} icon={ShoppingCart} color="violet" subtitle="Current month's spend" />
        <StatCard title="Active Suppliers" value={summary?.total_suppliers || 0} icon={Truck} color="emerald" subtitle="Registered procurement vendors" />
        <StatCard title="Products in Catalog" value={summary?.total_products || 0} icon={Package} color="amber" subtitle="Tracked inventory items" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={summary?.total_orders || 0} icon={ShoppingCart} color="sky" subtitle="Processed purchase orders" />
        <StatCard title="Pending Approval" value={summary?.pending_orders || 0} icon={Clock} color="amber" subtitle="Awaiting manager sign-off" />
        <StatCard title="Low Stock Items" value={summary?.low_stock_count || 0} icon={AlertTriangle} color="red" subtitle="Below reorder threshold" />
        <StatCard title="Avg Supplier Rating" value={`${summary?.avg_supplier_score || 0}/100`} icon={Star} color="emerald" subtitle="Vendor quality score" />
      </div>

      {/* Charts & AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base tracking-tight">Monthly Purchase Spend</h3>
              <p className="text-slate-400 text-xs mt-0.5">Expenditure trends across past 12 months</p>
            </div>
            <Link to="/ai/spend" className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors">
              Full analysis <ArrowRight size={13} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} tickFormatter={(v) => fmtK(v)} />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                formatter={(v) => [`LKR ${fmtK(v)}`, 'Spend']}
              />
              <Area type="monotone" dataKey="spend" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights Card */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">AI Insights & Health</h3>
                <p className="text-slate-400 text-xs">Real-time ML risk signals</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-700/30 rounded-xl p-3.5 border border-slate-700/50">
                <p className="text-slate-400 text-xs font-medium mb-2.5">Supplier Risk Breakdown</p>
                <div className="space-y-2">
                  {[
                    { key: 'low', label: 'Low Risk', color: 'bg-emerald-400', text: 'text-emerald-400' },
                    { key: 'medium', label: 'Medium Risk', color: 'bg-amber-400', text: 'text-amber-400' },
                    { key: 'high', label: 'High Risk', color: 'bg-rose-400', text: 'text-rose-400' },
                  ].map(({ key, label, color, text }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-slate-300">{label}</span>
                      </div>
                      <span className={`font-bold ${text}`}>
                        {insights?.supplier_risk_distribution?.[key] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-3.5 border border-slate-700/50">
                <p className="text-slate-400 text-xs font-medium mb-1">Products Needing Reorder</p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-white text-2xl font-bold tracking-tight">{insights?.products_needing_reorder || 0}</p>
                  <Link to="/ai/forecast" className="text-xs text-sky-400 hover:underline">
                    View forecast →
                  </Link>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">Based on AI predictive demand analysis</p>
              </div>

              {(summary?.high_risk_suppliers || 0) > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-rose-400 text-xs font-semibold">{summary?.high_risk_suppliers} High Risk Suppliers Detected</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Vendor mitigation or re-allocation recommended.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link to="/ai/risk" className="mt-4 text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1">
            Supplier risk dashboard <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base tracking-tight">Recent Purchase Orders</h3>
              <p className="text-slate-400 text-xs">Latest procurement orders in pipeline</p>
            </div>
            <Link to="/orders" className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1">
              View all orders <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/40">
            {summary?.recent_orders?.length > 0 ? (
              summary.recent_orders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between hover:bg-slate-700/10 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="text-slate-100 text-sm font-semibold">{o.order_number}</p>
                    <p className="text-slate-400 text-xs">{o.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-100 text-sm font-bold">LKR {(o.total_amount / 1000).toFixed(0)}K</p>
                    <span className={statusCls[o.status] || 'badge-pending'}>{o.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-6 text-center">No recent orders recorded.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base tracking-tight">Low Stock Alerts</h3>
                <p className="text-slate-400 text-xs">Items below minimum safety stock levels</p>
              </div>
            </div>
            <Link to="/products" className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1">
              Manage inventory <ArrowRight size={13} />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-medium">All stock levels healthy</p>
              <p className="text-slate-500 text-xs mt-0.5">No products currently below their reorder threshold.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between hover:bg-slate-700/10 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="text-slate-100 text-sm font-semibold">{p.name}</p>
                    <p className="text-slate-400 text-xs">{p.sku} • {p.category || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-rose-400 text-sm font-bold">{p.current_stock} {p.unit}</p>
                    <p className="text-slate-500 text-xs">Min threshold: {p.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
