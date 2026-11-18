import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { Package, Plus, Search, Filter, Edit2, CheckCircle, AlertTriangle, RefreshCw, X, Box } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  sku: '',
  name: '',
  category: '',
  description: '',
  unit: 'units',
  unit_price: '',
  current_stock: '',
  reorder_level: '',
  max_stock: ''
}

const stockBadge = (status) => ({
  low: <span className="badge-high"><AlertTriangle size={12} /> Low Stock</span>,
  ok: <span className="badge-low"><CheckCircle size={12} /> In Stock</span>,
  excess: <span className="badge-medium"><Box size={12} /> Excess</span>,
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
      .then(([pr, cr]) => {
        setProducts(pr.data)
        setCategories(cr.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category || '',
      description: p.description || '',
      unit: p.unit,
      unit_price: p.unit_price,
      current_stock: p.current_stock,
      reorder_level: p.reorder_level,
      max_stock: p.max_stock
    })
    setEditId(p.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        unit_price: parseFloat(form.unit_price),
        current_stock: parseFloat(form.current_stock),
        reorder_level: parseFloat(form.reorder_level),
        max_stock: parseFloat(form.max_stock)
      }
      if (editId) {
        await updateProduct(editId, payload)
        toast.success('Product updated successfully')
      } else {
        await createProduct(payload)
        toast.success('Product created successfully')
      }
      setShowModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const lowCount = products.filter(p => p.stock_status === 'low').length
  const okCount = products.filter(p => p.stock_status === 'ok').length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage inventory items, unit prices, reorder thresholds, and catalog status."
      >
        <div className="flex items-center gap-3">
          <button onClick={() => load()} className="btn-secondary" disabled={loading} title="Refresh Inventory">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </PageHeader>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Package size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Total Products</p>
            <p className="text-xl font-bold text-white mt-0.5">{products.length}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Low Stock Alerts</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{lowCount}</p>
          </div>
        </div>

        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Stock Healthy</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{okCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by product name or SKU code..."
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
        <div className="relative sm:w-64">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="input pl-10 cursor-pointer"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); load(e.target.value) }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner text="Loading catalog items..." /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th className="text-right">Unit Price (LKR)</th>
                <th className="text-right">Current Stock</th>
                <th className="text-right">Reorder Level</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <code className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-md text-xs font-mono border border-sky-500/20">
                      {p.sku}
                    </code>
                  </td>
                  <td className="font-semibold text-slate-100">{p.name}</td>
                  <td>
                    <span className="category-pill">{p.category || 'General'}</span>
                  </td>
                  <td className="text-right font-medium text-slate-100">
                    {(p.unit_price).toLocaleString()}
                  </td>
                  <td className="text-right">
                    <span className={`font-semibold ${p.stock_status === 'low' ? 'text-rose-400' : 'text-slate-200'}`}>
                      {p.current_stock} {p.unit}
                    </span>
                  </td>
                  <td className="text-right text-slate-400 text-xs font-medium">{p.reorder_level}</td>
                  <td>{stockBadge(p.stock_status)}</td>
                  <td className="text-center">
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit Product"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-12">
                    No products matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-700">
              <h3 className="text-white text-lg font-bold">
                {editId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">SKU Code *</label>
                <input
                  className="input"
                  placeholder="e.g. EL-001"
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  disabled={!!editId}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Industrial Sensor Module"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  className="input"
                  placeholder="Electronics"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  className="input"
                  placeholder="units / kg / pcs"
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Unit Price (LKR) *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="1500"
                  value={form.unit_price}
                  onChange={e => setForm({ ...form, unit_price: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Current Stock *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={form.current_stock}
                  onChange={e => setForm({ ...form, current_stock: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Reorder Level *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={form.reorder_level}
                  onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Max Stock</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={form.max_stock}
                  onChange={e => setForm({ ...form, max_stock: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Brief item specifications..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/80">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.sku || !form.name}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
