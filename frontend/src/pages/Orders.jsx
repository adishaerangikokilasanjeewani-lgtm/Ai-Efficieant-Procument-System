import { useEffect, useState } from 'react'
import { getOrders, getSuppliers, getProducts, createOrder, approveOrder, receiveOrder, cancelOrder } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Plus, Search, CheckCircle, Package, X, Eye, ChevronDown, AlertTriangle } from 'lucide-react'
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
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ supplier_id: '', expected_delivery: '', notes: '', items: [] })
  const [saving, setSaving] = useState(false)

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
    if (!form.supplier_id || form.items.length === 0) { toast.error('Select supplier and add items'); return }
    setSaving(true)
    try {
      const payload = { supplier_id: parseInt(form.supplier_id), expected_delivery: form.expected_delivery || null, notes: form.notes, items: form.items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price) })) }
      const res = await createOrder(payload)
      toast.success(`Order ${res.data.order_number} created!`)
      setShowCreate(false); setForm({ supplier_id: '', expected_delivery: '', notes: '', items: [] }); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Create failed') }
    finally { setSaving(false) }
  }

  const canApprove = user?.role === 'admin' || user?.role === 'procurement_manager'
  const [actionLoading, setActionLoading] = useState(false)

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
        toast.success(`Order ${order.order_number} received! Warehouse stock auto-updated.`)
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

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Purchase Orders" subtitle="Manage and track all procurement orders">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Order
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search order number or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value) }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <LoadingSpinner text="Loading orders..." /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Order #</th><th>Supplier</th><th>Requested By</th><th>Date</th><th>Expected Delivery</th><th>Amount (LKR)</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><span className="text-sky-400 font-medium">{o.order_number}</span></td>
                  <td>{o.supplier}</td>
                  <td className="text-slate-400 text-xs">{o.requested_by}</td>
                  <td className="text-slate-400 text-xs">{new Date(o.order_date).toLocaleDateString()}</td>
                  <td className="text-slate-400 text-xs">{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : '—'}</td>
                  <td className="font-medium">{o.total_amount.toLocaleString('en-LK', { minimumFractionDigits: 0 })}</td>
                  <td><span className={statusCls[o.status] || 'badge-pending'}>{o.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {o.status === 'pending' && canApprove && (
                        <button onClick={() => setConfirmAction({ type: 'approve', order: o })} className="text-xs btn-success py-1 px-2" title="Approve Order">
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {(o.status === 'approved' || (o.status === 'pending' && canApprove)) && (
                        <button onClick={() => setConfirmAction({ type: 'receive', order: o })} className="text-xs btn-primary py-1 px-2" title="Mark Received & Auto-Update Stock">
                          <Package size={13} /> Receive
                        </button>
                      )}
                      {(o.status === 'pending' || o.status === 'approved') && (
                        <button onClick={() => setConfirmAction({ type: 'cancel', order: o })} className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors" title="Cancel">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-lg font-semibold mb-5">Create Purchase Order</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="label">Supplier *</label>
                <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Expected Delivery</label>
                <input type="date" className="input" value={form.expected_delivery} onChange={e => setForm({ ...form, expected_delivery: e.target.value })} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-slate-300 font-medium text-sm">Order Items</h4>
              <button onClick={addItem} className="text-xs btn-secondary py-1 px-2"><Plus size={13} /> Add Item</button>
            </div>

            {form.items.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-600 rounded-lg mb-4">
                Click "Add Item" to add products to this order
              </div>
            )}

            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-5">
                  <select className="input text-xs" value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input className="input text-xs" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <input className="input text-xs" type="number" min="0" placeholder="Unit Price" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                </div>
              </div>
            ))}

            {form.items.length > 0 && (
              <div className="bg-slate-700/40 rounded-lg p-3 mb-4">
                <p className="text-slate-400 text-xs">Total Order Value</p>
                <p className="text-white text-xl font-bold">LKR {totalOrder.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Creating...' : 'Create Order'}
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
                  ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-700'
                  : confirmAction.type === 'receive'
                  ? 'bg-sky-900/60 text-sky-400 border border-sky-700'
                  : 'bg-red-900/60 text-red-400 border border-red-700'
              }`}>
                {confirmAction.type === 'approve' && <CheckCircle size={22} />}
                {confirmAction.type === 'receive' && <Package size={22} />}
                {confirmAction.type === 'cancel' && <AlertTriangle size={22} />}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {confirmAction.type === 'approve' && 'Approve Purchase Order'}
                  {confirmAction.type === 'receive' && 'Receive Order & Update Stock'}
                  {confirmAction.type === 'cancel' && 'Cancel Purchase Order'}
                </h3>
                <p className="text-slate-400 text-xs">
                  {confirmAction.order.order_number} • {confirmAction.order.supplier}
                </p>
              </div>
            </div>

            <div className="bg-slate-700/40 rounded-xl p-4 mb-5 border border-slate-700/60 text-sm text-slate-300">
              {confirmAction.type === 'approve' && (
                <p>
                  Are you sure you want to <strong className="text-emerald-400">Approve</strong> Order <code className="text-sky-300">{confirmAction.order.order_number}</code>? Once approved, the vendor will be notified to dispatch the goods.
                </p>
              )}
              {confirmAction.type === 'receive' && (
                <p>
                  Are you sure you want to mark Order <code className="text-sky-300">{confirmAction.order.order_number}</code> as <strong className="text-sky-400">Received</strong>? All product quantities in this order will be <strong>automatically added to warehouse inventory</strong>.
                </p>
              )}
              {confirmAction.type === 'cancel' && (
                <p>
                  Are you sure you want to <strong className="text-red-400">Cancel</strong> Order <code className="text-sky-300">{confirmAction.order.order_number}</code>? This action cannot be undone.
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
                <span>Total Order Value:</span>
                <span className="text-white font-semibold">
                  LKR {confirmAction.order.total_amount.toLocaleString('en-LK', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="btn-secondary flex-1 justify-center"
              >
                No, Cancel
              </button>
              <button
                onClick={executeConfirm}
                disabled={actionLoading}
                className={`flex-1 justify-center ${
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
                    ? 'Yes, Receive & Add Stock'
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
