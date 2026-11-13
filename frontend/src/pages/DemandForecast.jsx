import { useEffect, useState } from 'react'
import { getDemandForecast } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Brain, RefreshCw, TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DemandForecast() {
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
    <div className="p-6 space-y-6">
      <PageHeader title="AI Demand Forecast" subtitle="Machine learning-based next month purchasing predictions">
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* Info banner */}
      <div className="bg-violet-900/20 border border-violet-800/40 rounded-xl p-4 flex items-start gap-3">
        <Brain size={20} className="text-violet-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-violet-300 font-medium text-sm">Random Forest ML Model</p>
          <p className="text-slate-400 text-xs mt-1">Predictions based on 12 months of historical demand data. Features include seasonal patterns, lag values, and rolling averages. Data labeled as <strong className="text-slate-300">sample/dummy</strong> for demonstration.</p>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Running demand model..." /> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-slate-400 text-xs">Total Products Analysed</p>
              <p className="text-white text-3xl font-bold mt-1">{forecasts.length}</p>
            </div>
            <div className="card border-red-800/30">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-400" /><p className="text-slate-400 text-xs">Need Reorder</p></div>
              <p className="text-red-400 text-3xl font-bold">{reorderCount}</p>
            </div>
            <div className="card border-emerald-800/30">
              <div className="flex items-center gap-2 mb-1"><CheckCircle size={16} className="text-emerald-400" /><p className="text-slate-400 text-xs">Stock OK</p></div>
              <p className="text-emerald-400 text-3xl font-bold">{forecasts.length - reorderCount}</p>
            </div>
          </div>

          {/* Top products chart */}
          <div className="card">
            <h3 className="text-white font-semibold mb-1">Top 10 Products by Predicted Demand</h3>
            <p className="text-slate-400 text-xs mb-4">Predicted units needed next month</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topChart} layout="vertical" margin={{ left: 160, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="product_name" tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} width={155} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#f1f5f9' }} formatter={(v) => [v.toFixed(0) + ' units', 'Predicted Demand']} />
                <Bar dataKey="predicted_demand" radius={[0, 4, 4, 0]}>
                  {topChart.map((entry, i) => (
                    <Cell key={i} fill={entry.needs_reorder ? '#ef4444' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-slate-400 text-xs">Needs Reorder</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-sky-500" /><span className="text-slate-400 text-xs">Stock OK</span></div>
            </div>
          </div>

          {/* Table */}
          <div className="flex gap-3 flex-wrap">
            {['all', 'reorder', 'ok'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {f === 'all' ? 'All Products' : f === 'reorder' ? `⚠ Needs Reorder (${reorderCount})` : `✓ Stock OK`}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Category</th><th>Current Stock</th><th>Predicted Demand</th><th>Recommended Order</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.product_id}>
                    <td><code className="text-sky-400 text-xs">{f.sku}</code></td>
                    <td className="font-medium text-slate-100">{f.product_name}</td>
                    <td className="text-slate-400 text-xs">{f.category}</td>
                    <td>{f.current_stock}</td>
                    <td className="font-semibold text-violet-400">{f.predicted_demand.toFixed(0)}</td>
                    <td>
                      {f.recommended_order_qty > 0 ? (
                        <span className="text-amber-400 font-semibold">{f.recommended_order_qty.toFixed(0)} units</span>
                      ) : <span className="text-emerald-400">—</span>}
                    </td>
                    <td>
                      {f.needs_reorder
                        ? <span className="badge-high">⚠ Reorder</span>
                        : <span className="badge-low">✓ OK</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No results</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs">* Generated at: {data?.generated_at ? new Date(data.generated_at).toLocaleString() : '—'} | Sample data used for demonstration</p>
        </>
      )}
    </div>
  )
}
