import { useEffect, useState } from 'react'
import { getOrders, getSuppliers, getProducts, createOrder, approveOrder, receiveOrder, cancelOrder } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Plus, Search, CheckCircle, Package, X, AlertTriangle, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const statusCls = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  received: 'badge-received',
  cancelled: 'badge-cancelled',
  ordered: 'badge-approved',
  partially_received: 'badge-medium',
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ supplier_id: '', expected_delivery: '', notes: '', items: [] })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const load = (s = statusFilter) => {
    setLoading(true)
    getOrders(s || null).then(r => setOrders(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getSuppliers().then(r => setSuppliers(r.data))
    getProducts().then(r => setProducts(r.data))
  }, [])

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.toLowerCase().includes(search.toLowerCase())
  )

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_price: 0 }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const setItem = (i, field, val) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    if (field === 'product_id') {
      const p = products.find(p => p.id === parseInt(val))
      if (p) items[i].unit_price = p.unit_price
    }
    setForm({ ...form, items })
  }

  const handleCreate = async () => {
    if (!form.supplier_id || form.items.length === 0) {
      toast.error('Please select a supplier and add at least one item')
      return
    }
    setSaving(true)
    try {
      const payload = {
        supplier_id: parseInt(form.supplier_id),
        expected_delivery: form.expected_delivery || null,
        notes: form.notes,
        items: form.items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_price)
        }))
      }
      const res = await createOrder(payload)
      toast.success(`Purchase order ${res.data.order_number} created!`)
      setShowCreate(false)
      setForm({ supplier_id: '', expected_delivery: '', notes: '', items: [] })
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create order')
    } finally {
      setSaving(false)
    }
  }

  const canApprove = user?.role === 'admin' || user?.role === 'procurement_manager'

  const executeConfirm = async () => {
    if (!confirmAction) return
    const { type, order } = confirmAction
    setActionLoading(true)
    try {
      if (type === 'approve') {
        await approveOrder(order.id)
        toast.success(`Order ${order.order_number} approved successfully!`)
      } else if (type === 'receive') {
        await receiveOrder(order.id)
        toast.success(`Order ${order.order_number} received! Warehouse stock updated.`)
      } else if (type === 'cancel') {
        await cancelOrder(order.id)
        toast.success(`Order ${order.order_number} cancelled!`)
      }
      setConfirmAction(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const totalOrder = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0)

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    received: orders.filter(o => o.status === 'received').length,
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Purchase Orders"
        subtitle="Create, approve, and track vendor procurement orders with automatic inventory synchronization."
      >
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Purchase Order
        </button>
      </PageHeader>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-x-auto">
          {[
            { id: '', label: 'All Orders', count: statusCounts.all },
            { id: 'pending', label: 'Pending', count: statusCounts.pending },
            { id: 'approved', label: 'Approved', count: statusCounts.approved },
            { id: 'received', label: 'Received', count: statusCounts.received },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); load(tab.id) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search order number or vendor..."
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
      </div>

      {/* Orders Table */}
      {loading ? <LoadingSpinner text="Loading purchase orders..." /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Requested By</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th className="text-right">Total Amount (LKR)</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <span className="font-mono text-sky-400 font-semibold text-xs">
                      {o.order_number}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-100">{o.supplier}</td>
                  <td className="text-slate-400 text-xs">{o.requested_by || 'Staff'}</td>
                  <td className="text-slate-400 text-xs">
                    {new Date(o.order_date).toLocaleDateString()}
                  </td>
                  <td className="text-slate-400 text-xs">
                    {o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : '—'}
                  </td>
                  <td className="text-right font-bold text-slate-100">
                    {o.total_amount.toLocaleString('en-LK', { minimumFractionDigits: 0 })}
                  </td>
                  <td>
                    <span className={statusCls[o.status] || 'badge-pending'}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {o.status === 'pending' && canApprove && (
                        <button
                          onClick={() => setConfirmAction({ type: 'approve', order: o })}
                          className="btn-success text-xs py-1 px-2.5 rounded-lg"
                          title="Approve Order"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {(o.status === 'approved' || (o.status === 'pending' && canApprove)) && (
                        <button
                          onClick={() => setConfirmAction({ type: 'receive', order: o })}
                          className="btn-primary text-xs py-1 px-2.5 rounded-lg"
                          title="Receive & Add to Inventory"
                        >
                          <Package size={13} /> Receive
                        </button>
                      )}
                      {(o.status === 'pending' || o.status === 'approved') && (
                        <button
                          onClick={() => setConfirmAction({ type: 'cancel', order: o })}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Cancel Order"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No purchase orders found.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-700">
              <h3 className="text-white text-lg font-bold">Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Select Supplier Vendor *</label>
                <select
                  className="input cursor-pointer"
                  value={form.supplier_id}
                  onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                >
                  <option value="">Choose vendor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category || 'General'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Expected Delivery Date</label>
                <input
                  type="date"
                  className="input cursor-pointer"
                  value={form.expected_delivery}
                  onChange={e => setForm({ ...form, expected_delivery: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Order Notes / Reference</label>
                <input
                  className="input"
                  placeholder="e.g. Urgent Q4 reorder"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between pt-2">
              <h4 className="text-slate-200 font-semibold text-sm">Line Items</h4>
              <button onClick={addItem} className="btn-secondary text-xs py-1 px-2.5">
                <Plus size={13} /> Add Product Item
              </button>
            </div>

            {form.items.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-700 rounded-xl mb-4">
                Click <strong>"Add Product Item"</strong> to choose items for this purchase order.
              </div>
            )}

            <div className="space-y-2 mb-4">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-700/30 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="col-span-5">
                    <select
                      className="input text-xs"
                      value={item.product_id}
                      onChange={e => setItem(i, 'product_id', e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      className="input text-xs"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => setItem(i, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className="input text-xs"
                      type="number"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={e => setItem(i, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => removeItem(i)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {form.items.length > 0 && (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Estimated Total</p>
                  <p className="text-white text-xl font-bold">
                    LKR {totalOrder.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-xs text-sky-400 font-semibold">
                  {form.items.length} {form.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-slate-700/80">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.supplier_id || form.items.length === 0}
                className="btn-primary flex-1"
              >
                {saving ? 'Creating Order...' : 'Confirm & Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                confirmAction.type === 'approve'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : confirmAction.type === 'receive'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {confirmAction.type === 'approve' && <CheckCircle size={22} />}
                {confirmAction.type === 'receive' && <Package size={22} />}
                {confirmAction.type === 'cancel' && <AlertTriangle size={22} />}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">
                  {confirmAction.type === 'approve' && 'Approve Purchase Order'}
                  {confirmAction.type === 'receive' && 'Receive Order & Update Stock'}
                  {confirmAction.type === 'cancel' && 'Cancel Purchase Order'}
                </h3>
                <p className="text-slate-400 text-xs font-mono">
                  {confirmAction.order.order_number} • {confirmAction.order.supplier}
                </p>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 mb-5 border border-slate-700/60 text-sm text-slate-300">
              {confirmAction.type === 'approve' && (
                <p>
                  Are you sure you want to <strong className="text-emerald-400">Approve</strong> Order <code className="text-sky-300">{confirmAction.order.order_number}</code>?
                </p>
              )}
              {confirmAction.type === 'receive' && (
                <p>
                  Are you sure you want to mark Order <code className="text-sky-300">{confirmAction.order.order_number}</code> as <strong className="text-sky-400">Received</strong>? Product items will be <strong>automatically added to warehouse inventory</strong>.
                </p>
              )}
              {confirmAction.type === 'cancel' && (
                <p>
                  Are you sure you want to <strong className="text-rose-400">Cancel</strong> Order <code className="text-sky-300">{confirmAction.order.order_number}</code>? This action cannot be reversed.
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
                <span>Total Order Value:</span>
                <span className="text-white font-bold">
                  LKR {confirmAction.order.total_amount.toLocaleString('en-LK', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="btn-secondary flex-1"
              >
                No, Go Back
              </button>
              <button
                onClick={executeConfirm}
                disabled={actionLoading}
                className={`flex-1 ${
                  confirmAction.type === 'approve'
                    ? 'btn-success'
                    : confirmAction.type === 'receive'
                    ? 'btn-primary'
                    : 'btn-danger'
                }`}
              >
                {actionLoading ? 'Processing...' : (
                  confirmAction.type === 'approve'
                    ? 'Yes, Approve'
                    : confirmAction.type === 'receive'
                    ? 'Yes, Receive Order'
                    : 'Yes, Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
