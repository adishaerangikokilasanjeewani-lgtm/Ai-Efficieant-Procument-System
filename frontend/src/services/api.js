import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

export const getMe = () => api.get('/auth/me')

// ── Dashboard ────────────────────────────────────────────────────
export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getMonthlySpend = () => api.get('/dashboard/monthly-spend')
export const getLowStock = () => api.get('/dashboard/low-stock')

// ── Suppliers ────────────────────────────────────────────────────
export const getSuppliers = () => api.get('/suppliers')
export const getSupplier = (id) => api.get(`/suppliers/${id}`)
export const createSupplier = (data) => api.post('/suppliers', data)
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data)
export const addSupplierPerformance = (data) => api.post('/suppliers/performance', data)

// ── Products ─────────────────────────────────────────────────────
export const getProducts = (category) => api.get('/products', { params: category ? { category } : {} })
export const getProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const getCategories = () => api.get('/products/categories/list')

// ── Purchase Orders ──────────────────────────────────────────────
export const getOrders = (status) => api.get('/orders', { params: status ? { status } : {} })
export const getOrder = (id) => api.get(`/orders/${id}`)
export const createOrder = (data) => api.post('/orders', data)
export const approveOrder = (id) => api.put(`/orders/${id}/approve`)
export const receiveOrder = (id) => api.put(`/orders/${id}/receive`)
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`)

// ── AI / ML ───────────────────────────────────────────────────────
export const getDemandForecast = () => api.get('/ai/demand-forecast')
export const getSupplierRisk = () => api.get('/ai/supplier-risk')
export const getSupplierRecommendations = (category) => api.get('/ai/supplier-recommendations', { params: category ? { product_category: category } : {} })
export const getSpendAnalysis = () => api.get('/ai/spend-analysis')
export const getAiInsights = () => api.get('/ai/dashboard-insights')

// ── Users ─────────────────────────────────────────────────────────
export const getUsers = () => api.get('/users')

export default api
