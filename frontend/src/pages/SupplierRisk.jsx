import { useEffect, useState } from 'react'
import { getSupplierRisk, getSupplierRecommendations } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Star, TrendingUp } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

const riskColor = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' }
const riskBg = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }
const recColor = { 'Recommended': 'text-emerald-400', 'Consider': 'text-amber-400', 'Avoid': 'text-red-400' }

export default function SupplierRisk() {
  const [risks, setRisks] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('risk')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([getSupplierRisk(), getSupplierRecommendations()])
      .then(([r, rc]) => { setRisks(r.data.risk_assessments || []); setRecs(rc.data.recommendations || []) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const low = risks.filter(r => r.risk_level === 'low').length
  const med = risks.filter(r => r.risk_level === 'medium').length
  const high = risks.filter(r => r.risk_level === 'high').length

  const radarData = selected ? [
    { metric: 'Delivery', value: selected.delivery_score },
    { metric: 'Quality', value: selected.quality_score },
    { metric: 'Price', value: selected.price_score },
    { metric: 'Response', value: selected.response_score },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Supplier Risk & Recommendations" subtitle="AI-powered supplier risk assessment and ranking">
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* Risk summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={18} className="text-emerald-400" /><p className="text-slate-400 text-sm">Low Risk</p></div>
          <p className="text-emerald-400 text-3xl font-bold">{low}</p>
          <p className="text-slate-500 text-xs mt-1">suppliers</p>
        </div>
        <div className="card border-amber-800/30">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-amber-400" /><p className="text-slate-400 text-sm">Medium Risk</p></div>
          <p className="text-amber-400 text-3xl font-bold">{med}</p>
          <p className="text-slate-500 text-xs mt-1">suppliers</p>
        </div>
        <div className="card border-red-800/30">
          <div className="flex items-center gap-2 mb-2"><Shield size={18} className="text-red-400" /><p className="text-slate-400 text-sm">High Risk</p></div>
          <p className="text-red-400 text-3xl font-bold">{high}</p>
          <p className="text-slate-500 text-xs mt-1">suppliers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {['risk', 'recommendations'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {t === 'risk' ? '🛡 Risk Assessment' : '⭐ Supplier Ranking'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Analyzing suppliers..." /> : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {tab === 'risk' && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Supplier</th><th>Category</th><th>Delivery</th><th>Quality</th><th>Price</th><th>Response</th><th>Overall</th><th>Risk</th></tr>
                  </thead>
                  <tbody>
                    {risks.sort((a, b) => b.risk_score - a.risk_score).map(r => (
                      <tr key={r.supplier_id} onClick={() => setSelected(r)} className="cursor-pointer hover:bg-slate-700/40">
                        <td className="font-medium text-slate-100">{r.supplier_name}</td>
                        <td className="text-slate-400 text-xs">{r.category}</td>
                        <td><ScoreBar value={r.delivery_score} /></td>
                        <td><ScoreBar value={r.quality_score} /></td>
                        <td><ScoreBar value={r.price_score} /></td>
                        <td><ScoreBar value={r.response_score} /></td>
                        <td className="font-bold text-slate-200">{r.overall_score.toFixed(1)}</td>
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
                    <tr><th>Rank</th><th>Supplier</th><th>Category</th><th>Lead Time</th><th>Rank Score</th><th>Recommendation</th></tr>
                  </thead>
                  <tbody>
                    {recs.map(r => (
                      <tr key={r.supplier_id} onClick={() => setSelected(r)} className="cursor-pointer hover:bg-slate-700/40">
                        <td>
                          <span className={`font-bold text-lg ${r.rank <= 3 ? 'text-amber-400' : 'text-slate-400'}`}>#{r.rank}</span>
                        </td>
                        <td className="font-medium text-slate-100">{r.supplier_name}</td>
                        <td className="text-slate-400 text-xs">{r.category}</td>
                        <td className="text-slate-400">{r.lead_time_days} days</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-20">
                              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${r.rank_score}%` }} />
                            </div>
                            <span className="text-sky-400 text-xs font-medium">{r.rank_score.toFixed(1)}</span>
                          </div>
                        </td>
                        <td><span className={`text-xs font-semibold ${recColor[r.recommendation] || 'text-slate-400'}`}>{r.recommendation}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Radar detail panel */}
          <div className="card">
            <h3 className="text-white font-semibold mb-1">{selected ? selected.supplier_name : 'Select a Supplier'}</h3>
            <p className="text-slate-400 text-xs mb-4">{selected ? 'Performance radar' : 'Click a row to view details'}</p>
            {selected && radarData.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {['delivery_score', 'quality_score', 'price_score', 'response_score'].map(k => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs capitalize">{k.replace('_score', '').replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${selected[k]}%` }} />
                        </div>
                        <span className="text-sky-400 text-xs w-8 text-right">{selected[k]?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                  {selected.risk_level && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Risk Level</span>
                        <span className={riskBg[selected.risk_level]}>{selected.risk_level}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ value }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-slate-300 text-xs">{value?.toFixed(0)}</span>
    </div>
  )
}
