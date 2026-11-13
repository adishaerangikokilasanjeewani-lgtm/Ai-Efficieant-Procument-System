import { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { Plus, Search, Truck, Star, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const riskBadge = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  unknown: 'bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full text-xs',
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', category: '', payment_terms: 'Net 30', lead_time_days: 7 })
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
    setForm({ name: '', contact_person: '', email: '', phone: '', address: '', category: '', payment_terms: 'Net 30', lead_time_days: 7 })
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditSupplier(s)
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '', category: s.category || '', payment_terms: s.payment_terms || 'Net 30', lead_time_days: s.lead_time_days || 7 })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Supplier name is required'); return }
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

  if (loading) return <LoadingSpinner text="Loading suppliers..." />

  return (
    <div className="p-6">
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} active suppliers`}
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input className="input pl-9" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Lead Time</th>
              <th>Payment</th>
              <th>Score</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck size={14} className="text-sky-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{s.name}</p>
                      <p className="text-slate-500 text-xs">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td><span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded text-xs">{s.category || 'General'}</span></td>
                <td>
                  <p className="text-slate-200 text-sm">{s.contact_person || '—'}</p>
                  <p className="text-slate-500 text-xs">{s.phone || ''}</p>
                </td>
                <td className="text-slate-300">{s.lead_time_days} days</td>
                <td className="text-slate-300 text-xs">{s.payment_terms}</td>
                <td>
                  {s.overall_score != null ? (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" />
                      <span className={`text-sm font-medium ${s.overall_score >= 75 ? 'text-emerald-400' : s.overall_score >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
                        {s.overall_score.toFixed(1)}
                      </span>
                    </div>
                  ) : <span className="text-slate-500 text-xs">N/A</span>}
                </td>
                <td><span className={riskBadge[s.risk_level] || riskBadge.unknown}>{s.risk_level}</span></td>
                <td>
                  <button onClick={() => openEdit(s)} className="text-sky-400 hover:text-sky-300 text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Truck size={32} className="mx-auto mb-2 opacity-40" />
            <p>No suppliers found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">{editSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Supplier Name *', placeholder: 'e.g. TechStar Electronics' },
                { key: 'contact_person', label: 'Contact Person', placeholder: 'Full name' },
                { key: 'email', label: 'Email', placeholder: 'contact@supplier.com', type: 'email' },
                { key: 'phone', label: 'Phone', placeholder: '+94 11 xxx xxxx' },
                { key: 'address', label: 'Address', placeholder: 'Business address' },
              ].map(({ key, label, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} className="input" placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {['Electronics', 'IT Equipment', 'Office Supplies', 'Furniture', 'Cleaning', 'Safety Equipment', 'Construction', 'General Supplies'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Lead Time (days)</label>
                  <input type="number" className="input" min="1" value={form.lead_time_days}
                    onChange={e => setForm({ ...form, lead_time_days: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <select className="input" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                  {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Advance'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editSupplier ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
