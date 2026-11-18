import { useEffect, useState } from 'react'
import { getSpendAnalysis } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import { BarChart3, RefreshCw, TrendingUp, DollarSign } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = [
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // red
  '#c084fc', // purple
  '#2dd4bf', // teal
  '#fb923c', // orange
  '#a3e635', // lime
  '#f472b6', // pink
  '#60a5fa', // blue
  '#e879f9', // fuchsia
  '#4ade80', // green
  '#94a3b8', // slate
]

export default function SpendAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)

  const load = () => {
    setLoading(true)
    getSpendAnalysis().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const fmtLKR = (v) => v >= 1e6 ? `LKR ${(v / 1e6).toFixed(2)}M` : `LKR ${(v / 1000).toFixed(0)}K`

  const categoryData = data?.category_breakdown
    ? Object.entries(data.category_breakdown).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
    : []

  const activeCategory = activeIndex !== null && categoryData[activeIndex] ? categoryData[activeIndex] : null

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    if (percent < 0.06) return null
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 22
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#cbd5e1"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Spend Analysis"
        subtitle="Purchasing expenditure analytics, supplier partner concentration, and budget category breakdown."
      >
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
        </button>
      </PageHeader>

      {loading ? <LoadingSpinner text="Analyzing procurement spend data..." /> : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Approved Spend"
              value={fmtLKR(data?.total_spend || 0)}
              icon={DollarSign}
              color="sky"
              subtitle="All cumulative orders"
            />
            <StatCard
              title="Avg Order Value"
              value={fmtLKR(data?.avg_order_value || 0)}
              icon={TrendingUp}
              color="violet"
              subtitle="Per purchase order average"
            />
            <StatCard
              title="Total Orders Processed"
              value={data?.order_count || 0}
              icon={BarChart3}
              color="emerald"
              subtitle="Completed & approved orders"
            />
          </div>

          {/* Monthly Trend Area Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-base tracking-tight">Monthly Spend Trend</h3>
                <p className="text-slate-400 text-xs">Total purchasing expenditure by month</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.monthly_trend || []}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                  }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                  formatter={v => [fmtLKR(v), 'Spend']}
                />
                <Area type="monotone" dataKey="total_amount" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Side by Side: Top Suppliers Bar & Category Donut */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Suppliers Bar Chart */}
            <div className="card flex flex-col justify-between">
              <div>
                <h3 className="text-white font-bold text-base tracking-tight mb-0.5">Top 10 Suppliers by Spend</h3>
                <p className="text-slate-400 text-xs mb-4">Highest value procurement partners</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.top_suppliers || []} layout="vertical" margin={{ left: 120, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.5} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1e6).toFixed(1)}M`}
                  />
                  <YAxis
                    type="category"
                    dataKey="supplier_name"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickLine={false}
                    width={115}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                    itemStyle={{ color: '#a78bfa', fontWeight: 600 }}
                    formatter={v => [fmtLKR(v), 'Spend']}
                  />
                  <Bar dataKey="total_amount" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Donut Pie Chart */}
            <div className="card flex flex-col justify-between">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-bold text-base tracking-tight mb-0.5">Spend by Category</h3>
                  <p className="text-slate-400 text-xs">Distribution of purchasing budget</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                  {categoryData.length} Categories
                </span>
              </div>

              {categoryData.length > 0 ? (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={renderCustomLabel}
                        labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {categoryData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
                            style={{ outline: 'none', transition: 'opacity 0.2s', cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                        }}
                        formatter={(v, name) => {
                          const total = data?.total_spend || 1
                          const pct = ((v / total) * 100).toFixed(1)
                          return [`${fmtLKR(v)} (${pct}%)`, name]
                        }}
                      />
                      {/* Donut center KPI info */}
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
                        {activeCategory ? activeCategory.name : 'Total Spend'}
                      </text>
                      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#f8fafc" fontSize={14} fontWeight={700}>
                        {activeCategory ? fmtLKR(activeCategory.value) : fmtLKR(data?.total_spend || 0)}
                      </text>
                      {activeCategory ? (
                        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fill="#38bdf8" fontSize={11} fontWeight={600}>
                          {`${((activeCategory.value / (data?.total_spend || 1)) * 100).toFixed(1)}%`}
                        </text>
                      ) : (
                        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize={10}>
                          Hover for details
                        </text>
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-slate-500 text-center py-16">No category data available</p>}
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="card">
            <h3 className="text-white font-bold text-base tracking-tight mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {categoryData.map((cat, i) => {
                const pct = ((cat.value / (data?.total_spend || 1)) * 100)
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-200 text-sm font-medium flex-1">{cat.name}</span>
                    <div className="flex-1 bg-slate-700/60 rounded-full h-2 max-w-xs overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-slate-400 text-xs font-semibold w-12 text-right">{pct.toFixed(1)}%</span>
                    <span className="text-slate-100 text-sm font-bold w-32 text-right">{fmtLKR(cat.value)}</span>
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
