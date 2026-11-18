import { useEffect, useState } from 'react'
import { getSupplierRisk, getSupplierRecommendations } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Star, TrendingUp, ShieldAlert, Award } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

const riskColor = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-rose-400' }
const riskBg = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }
const recColor = {
  'Recommended': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Consider': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Avoid': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
}

export default function SupplierRisk() {
  const [risks, setRisks] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('risk')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([getSupplierRisk(), getSupplierRecommendations()])
      .then(([r, rc]) => {
        const riskList = r.data.risk_assessments || []
        setRisks(riskList)
        setRecs(rc.data.recommendations || [])
        if (riskList.length > 0 && !selected) {
          setSelected(riskList[0])
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const low = risks.filter(r => r.risk_level === 'low').length
  const med = risks.filter(r => r.risk_level === 'medium').length
  const high = risks.filter(r => r.risk_level === 'high').length

  const radarData = selected ? [
    { metric: 'Delivery', value: selected.delivery_score || 0 },
    { metric: 'Quality', value: selected.quality_score || 0 },
    { metric: 'Price', value: selected.price_score || 0 },
    { metric: 'Response', value: selected.response_score || 0 },
  ] : []

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Supplier Risk & Recommendations"
        subtitle="AI-powered supplier risk matrix, multi-criteria performance ranking, and vendor intelligence."
      >
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Intelligence
        </button>
      </PageHeader>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Low Risk Vendors</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{low}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Medium Risk</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{med}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">High Risk Alerts</p>
            <p className="text-2xl font-bold text-rose-400 mt-0.5">{high}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 max-w-fit">
        <button
          onClick={() => setTab('risk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === 'risk'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield size={14} /> Risk Assessment Matrix
        </button>
        <button
          onClick={() => setTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === 'recommendations'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={14} /> AI Supplier Ranking
        </button>
      </div>

      {loading ? <LoadingSpinner text="Evaluating supplier intelligence..." /> : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {tab === 'risk' && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Category</th>
                      <th>Delivery</th>
                      <th>Quality</th>
                      <th>Price</th>
                      <th>Response</th>
                      <th className="text-right">Overall</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.sort((a, b) => b.risk_score - a.risk_score).map(r => (
                      <tr
                        key={r.supplier_id}
                        onClick={() => setSelected(r)}
                        className={`cursor-pointer transition-colors ${
                          selected?.supplier_id === r.supplier_id ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <td className="font-semibold text-slate-100">{r.supplier_name}</td>
                        <td>
                          <span className="text-slate-400 text-xs">{r.category || 'General'}</span>
                        </td>
                        <td><ScoreBar value={r.delivery_score} /></td>
                        <td><ScoreBar value={r.quality_score} /></td>
                        <td><ScoreBar value={r.price_score} /></td>
                        <td><ScoreBar value={r.response_score} /></td>
                        <td className="text-right font-bold text-slate-100">
                          {r.overall_score.toFixed(1)}
                        </td>
                        <td><span className={riskBg[r.risk_level]}>{r.risk_level}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'recommendations' && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Supplier</th>
                      <th>Category</th>
                      <th>Lead Time</th>
                      <th>Rank Score</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map(r => (
                      <tr
                        key={r.supplier_id}
                        onClick={() => setSelected(r)}
                        className={`cursor-pointer transition-colors ${
                          selected?.supplier_id === r.supplier_id ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <td>
                          <span className={`font-black text-sm px-2 py-0.5 rounded-md ${
                            r.rank === 1
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : r.rank <= 3
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'text-slate-400'
                          }`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td className="font-semibold text-slate-100">{r.supplier_name}</td>
                        <td>
                          <span className="text-slate-400 text-xs">{r.category || 'General'}</span>
                        </td>
                        <td className="text-slate-300 text-xs font-medium">{r.lead_time_days} days</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700/60 rounded-full h-1.5 w-24">
                              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${r.rank_score}%` }} />
                            </div>
                            <span className="text-sky-400 text-xs font-bold">{r.rank_score.toFixed(1)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            recColor[r.recommendation] || 'text-slate-400'
                          }`}>
                            {r.recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Radar Detail Panel */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/60">
                <div>
                  <h3 className="text-white font-bold text-base tracking-tight">
                    {selected ? selected.supplier_name : 'Vendor Breakdown'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {selected ? 'Multi-dimensional scorecard' : 'Click any row to inspect'}
                  </p>
                </div>
                {selected?.risk_level && (
                  <span className={riskBg[selected.risk_level]}>
                    {selected.risk_level} Risk
                  </span>
                )}
              </div>

              {selected && radarData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" opacity={0.6} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }} />
                    </RadarChart>
                  </ResponsiveContainer>

                  <div className="space-y-3 mt-4">
                    {[
                      { key: 'delivery_score', label: 'On-Time Delivery' },
                      { key: 'quality_score', label: 'Quality Acceptance' },
                      { key: 'price_score', label: 'Price Competitiveness' },
                      { key: 'response_score', label: 'Customer Responsiveness' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium">{label}</span>
                          <span className="text-sky-400 font-bold">{selected[key]?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-sky-500"
                            style={{ width: `${selected[key] || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Click a vendor in the table to display radar analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ value }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-slate-700/60 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-slate-300 text-xs font-semibold">{value?.toFixed(0)}</span>
    </div>
  )
}
