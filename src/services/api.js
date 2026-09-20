const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

function authHeaders() {
  const token = localStorage.getItem('powerbase_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function request(path, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) }
  // FormData must set its own Content-Type so the browser can add the
  // multipart boundary — forcing application/json here would corrupt uploads.
  if (options.body instanceof FormData) delete headers['Content-Type']
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const text = await response.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`)
  return data
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/profile'),
  getAddresses: () => request('/addresses'),
  createAddress: (payload) => request('/addresses', { method: 'POST', body: JSON.stringify(payload) }),
  updateAddress: (id, payload) => request(`/addresses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setDefaultAddress: (id) => request(`/addresses/${encodeURIComponent(id)}/default`, { method: 'PATCH' }),
  deleteAddress: (id) => request(`/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: () => request('/orders'),
  getOrderById: (id) => request(`/orders/${encodeURIComponent(id)}`),
  trackOrder: (reference) => request(`/orders/track/${encodeURIComponent(reference)}`, { headers: { 'Content-Type': 'application/json' } }),
  // Payment: getPayment is safe to poll (no side effects). initiatePayment is
  // idempotent server-side (see server/src/services/paymentService.js) — a
  // double-click or a retry after a network error returns the same
  // checkout link rather than opening a second Hubtel checkout.
  getPayment: (orderNumber) => request(`/payments/orders/${encodeURIComponent(orderNumber)}`),
  initiatePayment: (orderNumber) => request(`/payments/orders/${encodeURIComponent(orderNumber)}/initiate`, { method: 'POST' }),
  getVendorOrders: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/orders/vendor/my-orders${query ? `?${query}` : ''}`)
  },
  getVendorOrderDetail: (vendorOrderId) => request(`/orders/vendor/my-orders/${encodeURIComponent(vendorOrderId)}`),
  updateVendorOrderStatus: (vendorOrderId, status) => request(`/orders/vendor/my-orders/${encodeURIComponent(vendorOrderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getVendorSettlements: () => request('/orders/vendor/my-settlements'),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  checkDatabase: () => request('/health/db', { headers: {} }),
  getProducts: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString()
    return request(`/products${query ? `?${query}` : ''}`)
  },
  getProduct: (id) => request(`/products/${encodeURIComponent(id)}`),
  getCategories: () => request('/products/categories'),

  // -- Vendor dashboard/profile/products/earnings --------------------------
  getVendorDashboard: () => request('/vendor/dashboard'),
  getVendorProfile: () => request('/vendor/profile'),
  updateVendorProfile: (payload) => request('/vendor/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getVendorProducts: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/vendor/products${query ? `?${query}` : ''}`)
  },
  getVendorProduct: (id) => request(`/vendor/products/${encodeURIComponent(id)}`),
  createVendorProduct: (payload) => request('/vendor/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateVendorProduct: (id, payload) => request(`/vendor/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setVendorProductStatus: (id, isActive) => request(`/vendor/products/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  updateVendorProductStock: (id, stock) => request(`/vendor/products/${encodeURIComponent(id)}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  // Relative adjustment (+5 / -2). The server computes the new value from the
  // stored quantity, so a stale figure in the browser can't overwrite stock.
  adjustVendorProductStock: (id, adjustment) => request(`/vendor/products/${encodeURIComponent(id)}/stock`, { method: 'PATCH', body: JSON.stringify({ adjustment }) }),
  getUploadStatus: () => request('/vendor/uploads/status'),
  // Multipart, so the JSON Content-Type default must not be applied here.
  uploadProductImage: (file) => {
    const body = new FormData()
    body.append('image', file)
    return request('/vendor/uploads/product-image', { method: 'POST', body })
  },
  getVendorInventory: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/vendor/inventory${query ? `?${query}` : ''}`)
  },
  getVendorEarnings: () => request('/vendor/earnings'),

  // -- Admin -----------------------------------------------------------------
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminOrders: () => request('/admin/orders'),
  updateDeliveryFee: (orderId, feeData) => request(`/admin/orders/${encodeURIComponent(orderId)}/delivery-fee`, { method: 'PUT', body: JSON.stringify(feeData) }),
  getAdminSettlements: () => request('/admin/settlements'),
  // Payment confirmation and order fulfilment are ADMIN-only and backend-
  // enforced. There is deliberately no customer- or vendor-facing way to
  // reach these — a frontend must never be able to declare a payment good.
  getAdminAllOrders: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/admin/orders/all${query ? `?${query}` : ''}`)
  },
  getAdminOrder: (orderId) => request(`/admin/orders/${encodeURIComponent(orderId)}`),
  confirmAdminOrderPayment: (orderId, payload) => request(`/admin/orders/${encodeURIComponent(orderId)}/payment`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateAdminOrderStatus: (orderId, status) => request(`/admin/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateAdminSettlement: (settlementId, payload) => request(`/admin/settlements/${encodeURIComponent(settlementId)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getAdminVendors: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/admin/vendors${query ? `?${query}` : ''}`)
  },
  getAdminVendor: (id) => request(`/admin/vendors/${encodeURIComponent(id)}`),
  createAdminVendor: (payload) => request('/admin/vendors', { method: 'POST', body: JSON.stringify(payload) }),
  setAdminVendorVerified: (id, verified) => request(`/admin/vendors/${encodeURIComponent(id)}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
  setAdminVendorStatus: (id, isActive) => request(`/admin/vendors/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  setAdminVendorShare: (id, defaultSharePercent) => request(`/admin/vendors/${encodeURIComponent(id)}/share`, { method: 'PATCH', body: JSON.stringify({ defaultSharePercent }) }),

  getAdminCustomers: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/admin/customers${query ? `?${query}` : ''}`)
  },
  getAdminCustomer: (id) => request(`/admin/customers/${encodeURIComponent(id)}`),
  setAdminCustomerStatus: (id, isActive) => request(`/admin/customers/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  getAdminProducts: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    return request(`/admin/products${query ? `?${query}` : ''}`)
  },
  setAdminProductStatus: (id, isActive) => request(`/admin/products/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  // Manual trigger for the same expired-reservation sweep that already runs
  // on a timer in the live server process (see server/src/server.js).
  runAdminReservationSweep: (hours) => request('/admin/reservations/expire', { method: 'POST', body: JSON.stringify(hours === undefined || hours === '' ? {} : { hours: Number(hours) }) }),

  getAdminCategories: () => request('/admin/categories'),
  createAdminCategory: (name) => request('/admin/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateAdminCategory: (id, name) => request(`/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteAdminCategory: (id) => request(`/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
