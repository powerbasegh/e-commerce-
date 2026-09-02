const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

function authHeaders() {
  const token = localStorage.getItem('powerbase_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } })
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
  getOrderByNumber: (orderNumber) => request(`/orders/${encodeURIComponent(orderNumber)}`),
  getOrderById: (id) => request(`/orders/${encodeURIComponent(id)}`),
  trackOrder: (reference) => request(`/orders/track/${encodeURIComponent(reference)}`, { headers: { 'Content-Type': 'application/json' } }),
  getVendorOrders: () => request('/orders/vendor/my-orders'),
  getVendorSettlements: () => request('/orders/vendor/my-settlements'),
  getPaymentForOrder: (orderNumber) => request(`/payments/orders/${encodeURIComponent(orderNumber)}`),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  checkDatabase: () => request('/health/db', { headers: {} }),
  getAdminOrders: () => request('/admin/orders'),
  updateDeliveryFee: (orderId, feeData) => request(`/admin/orders/${encodeURIComponent(orderId)}/delivery-fee`, { method: 'PUT', body: JSON.stringify(feeData) }),
  getAdminSettlements: () => request('/admin/settlements'),
  updateSettlement: (settlementId, data) => request(`/admin/settlements/${encodeURIComponent(settlementId)}`, { method: 'PUT', body: JSON.stringify(data) }),
}
