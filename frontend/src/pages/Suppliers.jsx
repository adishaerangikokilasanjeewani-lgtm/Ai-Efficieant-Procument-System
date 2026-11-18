import { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { Plus, Search, Truck, Star, AlertTriangle, X, CheckCircle, ShieldAlert, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const riskBadge = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  unknown: 'badge-cancelled',
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    payment_terms: 'Net 30',
    lead_time_days: 7
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getSuppliers().then(r => setSuppliers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditSupplier(null)
    setForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      payment_terms: 'Net 30',
      lead_time_days: 7
    })
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditSupplier(s)
    setForm({
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      category: s.category || '',
      payment_terms: s.payment_terms || 'Net 30',
      lead_time_days: s.lead_time_days || 7
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required')
      return
    }
    setSaving(true)
    try {
      if (editSupplier) {
        await updateSupplier(editSupplier.id, form)
        toast.success('Supplier updated successfully')
      } else {
        await createSupplier(form)
        toast.success('Supplier added successfully')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save supplier')
    } finally {
      setSaving(false)
    }
  }

  const highPerformers = suppliers.filter(s => s.overall_score >= 75).length
  const highRisk = suppliers.filter(s => s.risk_level === 'high').length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Suppliers"
        subtitle="Manage approved vendor directory, performance ratings, and delivery terms."
      >
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Supplier
        </button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Vendors</p>
            <p className="text-xl font-bold text-white mt-0.5">{suppliers.length}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Top Rated (&ge;75)</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{highPerformers}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">High Risk Vendors</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{highRisk}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Search by vendor name, category, or contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner text="Loading suppliers..." /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th className="text-right">Lead Time</th>
                <th>Payment Terms</th>
                <th className="text-center">Score</th>
                <th>Risk Level</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0 text-sky-400">
                        <Truck size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{s.name}</p>
                        <p className="text-slate-400 text-xs">{s.email || 'No email registered'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">
                      {s.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <p className="text-slate-200 text-sm font-medium">{s.contact_person || '—'}</p>
                    <p className="text-slate-500 text-xs">{s.phone || ''}</p>
                  </td>
                  <td className="text-right text-slate-300 font-medium">
                    {s.lead_time_days} days
                  </td>
                  <td className="text-slate-300 text-xs font-medium">
                    {s.payment_terms || 'Net 30'}
                  </td>
                  <td className="text-center">
                    {s.overall_score != null ? (
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full ${
                        s.overall_score >= 75
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.overall_score >= 55
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <Star size={11} className="fill-current" />
                        {s.overall_score.toFixed(1)}
                      </span>
                    ) : <span className="text-slate-500 text-xs">N/A</span>}
                  </td>
                  <td>
                    <span className={riskBadge[s.risk_level] || riskBadge.unknown}>
                      {s.risk_level || 'unknown'}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => openEdit(s)}
                      title="Edit Supplier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Truck size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No suppliers match your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-700">
              <h3 className="text-white text-lg font-bold">
                {editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Company / Supplier Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Tech Solutions"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Contact Person</label>
                <input
                  className="input"
                  placeholder="John Doe"
                  value={form.contact_person}
                  onChange={e => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  className="input"
                  placeholder="Electronics, Logistics..."
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="vendor@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  placeholder="+94 77 123 4567"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <select
                  className="input cursor-pointer"
                  value={form.payment_terms}
                  onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Advance">100% Advance</option>
                </select>
              </div>
              <div>
                <label className="label">Lead Time (Days)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="7"
                  value={form.lead_time_days}
                  onChange={e => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 7 })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Office Address</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Physical street address..."
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/80">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : editSupplier ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
