import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Package, Plus, Search, Filter, Edit2, TrendingDown, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = { sku: '', name: '', category: '', description: '', unit: 'units', unit_price: '', current_stock: '', reorder_level: '', max_stock: '' }

const stockBadge = (status) => ({
  low: <span className="badge-high">Low Stock</span>,
  ok: <span className="badge-low">In Stock</span>,
  excess: <span className="badge-medium">Excess</span>,
}[status] || null)

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = (cat = catFilter) => {
    setLoading(true)
    Promise.all([getProducts(cat || null), getCategories()])
      .then(([pr, cr]) => { setProducts(pr.data); setCategories(cr.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true) }
  const openEdit = (p) => {
    setForm({ sku: p.sku, name: p.name, category: p.category || '', description: p.description || '', unit: p.unit, unit_price: p.unit_price, current_stock: p.current_stock, reorder_level: p.reorder_level, max_stock: p.max_stock })
    setEditId(p.id); setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, unit_price: parseFloat(form.unit_price), current_stock: parseFloat(form.current_stock), reorder_level: parseFloat(form.reorder_level), max_stock: parseFloat(form.max_stock) }
      if (editId) { await updateProduct(editId, payload); toast.success('Product updated') }
      else { await createProduct(payload); toast.success('Product created') }
      setShowModal(false); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  const lowCount = products.filter(p => p.stock_status === 'low').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Products & Inventory" subtitle="Manage product catalog and stock levels">
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn-secondary" disabled={loading} title="Refresh Stock">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Stock
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </PageHeader>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2">
          <Package size={16} className="text-sky-400" />
          <span className="text-slate-300 text-sm">{products.length} Total Products</span>
        </div>
        {lowCount > 0 && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-400 text-sm">{lowCount} Low Stock Items</span>
          </div>
        )}
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-4 py-2 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm">{products.filter(p => p.stock_status === 'ok').length} Items OK</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative sm:w-56">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="input pl-9" value={catFilter} onChange={e => { setCatFilter(e.target.value); load(e.target.value) }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading products..." /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th><th>Product Name</th><th>Category</th>
                <th>Unit Price (LKR)</th><th>Stock</th><th>Reorder Level</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><code className="text-sky-400 text-xs">{p.sku}</code></td>
                  <td className="font-medium text-slate-100">{p.name}</td>
                  <td><span className="text-slate-400 text-xs">{p.category}</span></td>
                  <td>{(p.unit_price).toLocaleString()}</td>
                  <td>
                    <span className={p.stock_status === 'low' ? 'text-red-400 font-semibold' : 'text-slate-200'}>
                      {p.current_stock} {p.unit}
                    </span>
                  </td>
                  <td className="text-slate-400">{p.reorder_level}</td>
                  <td>{stockBadge(p.stock_status)}</td>
                  <td>
                    <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-sky-400 p-1 rounded transition-colors">
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-500 py-8">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-lg font-semibold mb-5">{editId ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">SKU *</label><input className="input" placeholder="EL-001" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} disabled={!!editId} /></div>
              <div className="col-span-2"><label className="label">Product Name *</label><input className="input" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Category</label><input className="input" placeholder="Electronics" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="label">Unit</label><input className="input" placeholder="units" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><label className="label">Unit Price (LKR)</label><input className="input" type="number" min="0" placeholder="1000" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} /></div>
              <div><label className="label">Current Stock</label><input className="input" type="number" min="0" placeholder="50" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} /></div>
              <div><label className="label">Reorder Level</label><input className="input" type="number" min="0" placeholder="10" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} /></div>
              <div><label className="label">Max Stock</label><input className="input" type="number" min="0" placeholder="500" value={form.max_stock} onChange={e => setForm({ ...form, max_stock: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={2} placeholder="Product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.sku || !form.name} className="btn-primary flex-1">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
