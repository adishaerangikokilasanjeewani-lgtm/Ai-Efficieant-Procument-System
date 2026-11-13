import { useEffect, useState } from 'react'
import { getSpendAnalysis } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart3, RefreshCw, TrendingUp, DollarSign } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export default function SpendAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getSpendAnalysis().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const fmtLKR = (v) => v >= 1e6 ? `LKR ${(v / 1e6).toFixed(2)}M` : `LKR ${(v / 1000).toFixed(0)}K`

  const categoryData = data?.category_breakdown
    ? Object.entries(data.category_breakdown).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
    : []

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Spend Analysis" subtitle="Purchasing expenditure trends, supplier breakdown and category analysis">
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {loading ? <LoadingSpinner text="Analysing spend data..." /> : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-2"><DollarSign size={18} className="text-sky-400" /><p className="text-slate-400 text-sm">Total Spend</p></div>
              <p className="text-white text-2xl font-bold">{fmtLKR(data?.total_spend || 0)}</p>
              <p className="text-slate-500 text-xs mt-1">All approved orders</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-violet-400" /><p className="text-slate-400 text-sm">Avg Order Value</p></div>
              <p className="text-white text-2xl font-bold">{fmtLKR(data?.avg_order_value || 0)}</p>
              <p className="text-slate-500 text-xs mt-1">Per purchase order</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2"><BarChart3 size={18} className="text-emerald-400" /><p className="text-slate-400 text-sm">Total Orders</p></div>
              <p className="text-white text-2xl font-bold">{data?.order_count || 0}</p>
              <p className="text-slate-500 text-xs mt-1">Completed orders</p>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="card">
            <h3 className="text-white font-semibold mb-1">Monthly Spend Trend</h3>
            <p className="text-slate-400 text-xs mb-4">Total purchasing expenditure by month</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.monthly_trend || []}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#f1f5f9' }} formatter={v => [fmtLKR(v), 'Spend']} />
                <Area type="monotone" dataKey="total_amount" stroke="#0ea5e9" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top suppliers bar chart */}
            <div className="card">
              <h3 className="text-white font-semibold mb-1">Top 10 Suppliers by Spend</h3>
              <p className="text-slate-400 text-xs mb-4">Highest value procurement partners</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.top_suppliers || []} layout="vertical" margin={{ left: 120, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="supplier_name" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickLine={false} width={115} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} formatter={v => [fmtLKR(v), 'Spend']} />
                  <Bar dataKey="total_amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category pie */}
            <div className="card">
              <h3 className="text-white font-semibold mb-1">Spend by Category</h3>
              <p className="text-slate-400 text-xs mb-4">Distribution of purchasing budget</p>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="45%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} formatter={v => [fmtLKR(v), 'Spend']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-center py-16">No category data available</p>}
            </div>
          </div>

          {/* Category table */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {categoryData.map((cat, i) => {
                const pct = ((cat.value / (data?.total_spend || 1)) * 100)
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300 text-sm flex-1">{cat.name}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-xs">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-slate-400 text-xs w-12 text-right">{pct.toFixed(1)}%</span>
                    <span className="text-slate-200 text-sm font-medium w-28 text-right">{fmtLKR(cat.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
