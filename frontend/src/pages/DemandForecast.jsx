import { useEffect, useState } from 'react'
import { getDemandForecast } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Brain, RefreshCw, TrendingUp, Package, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../context/ThemeContext'

export default function DemandForecast() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    getDemandForecast().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const forecasts = data?.forecasts || []
  const filtered = filter === 'reorder' ? forecasts.filter(f => f.needs_reorder) : filter === 'ok' ? forecasts.filter(f => !f.needs_reorder) : forecasts
  const topChart = [...forecasts].sort((a, b) => b.predicted_demand - a.predicted_demand).slice(0, 10)
  const reorderCount = forecasts.filter(f => f.needs_reorder).length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="AI Demand Forecast"
        subtitle="Machine learning-driven demand prediction and automated replenishment recommendations."
      >
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Forecast
        </button>
      </PageHeader>

      {/* Model Information Banner */}
      <div className="bg-gradient-to-r from-violet-900/30 to-sky-900/20 border border-violet-500/30 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
          <Brain size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-violet-300 font-bold text-sm">Random Forest Regression Engine</p>
            <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30 font-semibold">
              Live Model
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Forecasting is computed using historical consumption patterns, seasonal trends, rolling order averages, and inventory lead times.
          </p>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Executing demand forecast model..." /> : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Package size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Products Forecasted</p>
                <p className="text-2xl font-bold text-white mt-0.5">{forecasts.length}</p>
              </div>
            </div>

            <div className="card-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Reorders Required</p>
                <p className="text-2xl font-bold text-rose-400 mt-0.5">{reorderCount}</p>
              </div>
            </div>

            <div className="card-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Healthy Stock Sku</p>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5">{forecasts.length - reorderCount}</p>
              </div>
            </div>
          </div>

          {/* Top Products Bar Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-base tracking-tight">Top 10 Products by Predicted Next Month Demand</h3>
                <p className="text-slate-400 text-xs">Estimated consumption quantities requiring fulfillment</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-400">Needs Reorder</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-slate-400">Stock Healthy</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topChart} layout="vertical" margin={{ left: 140, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} horizontal={false} opacity={0.5} />
                <XAxis type="number" tick={{ fill: isDark ? '#64748b' : '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="product_name" tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11 }} tickLine={false} width={135} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                  labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600, fontSize: '12px' }}
                  itemStyle={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 600 }}
                  formatter={(v) => [`${v.toFixed(0)} units`, 'Predicted Demand']}
                />
                <Bar dataKey="predicted_demand" radius={[0, 6, 6, 0]}>
                  {topChart.map((entry, i) => (
                    <Cell key={i} fill={entry.needs_reorder ? '#f43f5e' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table with Filter Tabs */}
          <div className="tab-group flex gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 max-w-fit">
            {[
              { id: 'all', label: `All Items (${forecasts.length})` },
              { id: 'reorder', label: `Reorder Needed (${reorderCount})` },
              { id: 'ok', label: `Stock Healthy (${forecasts.length - reorderCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Current Stock</th>
                  <th className="text-right">Predicted Demand</th>
                  <th className="text-right">Recommended Reorder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.product_id}>
                    <td>
                      <code className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-md text-xs font-mono border border-sky-500/20">
                        {f.sku}
                      </code>
                    </td>
                    <td className="font-semibold text-slate-100">{f.product_name}</td>
                    <td>
                      <span className="category-pill">{f.category || 'General'}</span>
                    </td>
                    <td className="text-right font-medium text-slate-300">
                      {f.current_stock}
                    </td>
                    <td className="text-right font-bold text-violet-400">
                      {f.predicted_demand.toFixed(0)} units
                    </td>
                    <td className="text-right font-bold">
                      {f.recommended_order_qty > 0 ? (
                        <span className="text-amber-400">
                          +{f.recommended_order_qty.toFixed(0)} units
                        </span>
                      ) : <span className="text-emerald-400">—</span>}
                    </td>
                    <td>
                      {f.needs_reorder ? (
                        <span className="badge-high">
                          <AlertTriangle size={12} /> Reorder
                        </span>
                      ) : (
                        <span className="badge-low">
                          <CheckCircle size={12} /> Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500 py-12">
                      No forecast records matching this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
