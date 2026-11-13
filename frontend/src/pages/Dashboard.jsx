import { useEffect, useState } from 'react'
import { getDashboardSummary, getMonthlySpend, getLowStock, getAiInsights } from '../services/api'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingCart, Truck, Package, AlertTriangle, TrendingUp, Clock, CheckCircle, Brain, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const statusCls = { pending: 'badge-pending', approved: 'badge-approved', received: 'badge-received', cancelled: 'badge-cancelled', ordered: 'badge-approved' }

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
        setSummary(s.data); setMonthly(ms.data.slice(-12)); setLowStock(ls.data); setInsights(ai.data)
      }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const fmt = (n) => `LKR ${(n/1000000).toFixed(2)}M`
  const fmtK = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(Math.round(n))

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={`Welcome back, ${user?.full_name?.split(' ')[0]} 👋`} subtitle="Here's what's happening with your procurement today." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Spend" value={fmt(summary?.total_spend||0)} icon={TrendingUp} color="sky" subtitle="All time" />
        <StatCard title="This Month" value={fmt(summary?.monthly_spend||0)} icon={ShoppingCart} color="violet" subtitle="Monthly spend" />
        <StatCard title="Suppliers" value={summary?.total_suppliers||0} icon={Truck} color="emerald" subtitle="Active vendors" />
        <StatCard title="Products" value={summary?.total_products||0} icon={Package} color="amber" subtitle="In catalog" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={summary?.total_orders||0} icon={ShoppingCart} color="sky" />
        <StatCard title="Pending" value={summary?.pending_orders||0} icon={Clock} color="amber" subtitle="Awaiting approval" />
        <StatCard title="Low Stock" value={summary?.low_stock_count||0} icon={AlertTriangle} color="red" subtitle="Need reorder" />
        <StatCard title="Avg Score" value={`${summary?.avg_supplier_score||0}/100`} icon={Star} color="emerald" subtitle="Supplier rating" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h3 className="text-white font-semibold mb-1">Monthly Purchase Spend</h3>
          <p className="text-slate-400 text-xs mb-4">LKR spend trend</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}} tickLine={false}/>
              <YAxis tick={{fill:'#64748b',fontSize:11}} tickLine={false} tickFormatter={(v)=>fmtK(v)}/>
              <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'0.5rem'}} labelStyle={{color:'#f1f5f9'}} formatter={(v)=>[`LKR ${fmtK(v)}`,'Spend']}/>
              <Area type="monotone" dataKey="spend" stroke="#0ea5e9" strokeWidth={2} fill="url(#sg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-violet-400"/>
            <h3 className="text-white font-semibold">AI Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">Supplier Risk Distribution</p>
              {['low','medium','high'].map((k)=>(
                <div key={k} className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${k==='low'?'bg-emerald-400':k==='medium'?'bg-amber-400':'bg-red-400'}`}></div>
                  <span className="text-slate-300 text-xs flex-1 capitalize">{k} Risk</span>
                  <span className={`text-xs font-medium ${k==='low'?'text-emerald-400':k==='medium'?'text-amber-400':'text-red-400'}`}>{insights?.supplier_risk_distribution?.[k]||0}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-1">Products Needing Reorder</p>
              <p className="text-white text-2xl font-bold">{insights?.products_needing_reorder||0}</p>
              <p className="text-slate-400 text-xs">Based on AI forecast</p>
            </div>
            {(summary?.high_risk_suppliers||0) > 0 && (
              <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                <p className="text-amber-400 text-xs font-medium">⚠ {summary?.high_risk_suppliers} High Risk Suppliers</p>
                <p className="text-slate-400 text-xs mt-1">Review recommended</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Recent Purchase Orders</h3>
          <div className="space-y-2">
            {summary?.recent_orders?.map((o)=>(
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div><p className="text-slate-200 text-sm font-medium">{o.order_number}</p><p className="text-slate-400 text-xs">{o.supplier}</p></div>
                <div className="text-right">
                  <p className="text-slate-200 text-sm">LKR {(o.total_amount/1000).toFixed(0)}K</p>
                  <span className={statusCls[o.status]||'badge-pending'}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400"/>
            <h3 className="text-white font-semibold">Low Stock Alerts</h3>
          </div>
          {lowStock.length===0 ? (
            <div className="text-center py-8"><CheckCircle size={32} className="text-emerald-400 mx-auto mb-2"/><p className="text-slate-400 text-sm">All stock levels healthy</p></div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0,6).map((p)=>(
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div><p className="text-slate-200 text-sm font-medium">{p.name}</p><p className="text-slate-400 text-xs">{p.sku}</p></div>
                  <div className="text-right"><p className="text-red-400 text-sm font-medium">{p.current_stock} {p.unit}</p><p className="text-slate-500 text-xs">Min: {p.reorder_level}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
