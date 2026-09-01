// ---------------------------------------------------------------------------
// Legacy local order persistence fallback
// ---------------------------------------------------------------------------
// No backend/order API exists yet, so placed orders are mirrored to
// localStorage under ORDERS_STORAGE_KEY — same pattern as the cart's own
// persistence in src/context/CartContext.jsx. When a real backend exists,
// only createOrder/saveOrder/getOrderByNumber need to change to call an API
// instead of localStorage; callers (CheckoutPage, OrderSuccessPage) don't
// need to change.
//
// PRIVACY: the order object stored here is the customer/PowerBase-admin
// view and includes full delivery details (exact address, coordinates,
// contact info). `vendorGroups` on the order only ever carries what
// groupItemsByVendor() already produces — vendor id/name, items, subtotal —
// never the customer's contact or exact location. If/when this data is sent
// to a vendor-facing surface, use getVendorSafeDeliveryInfo() from
// src/data/deliveryDetails.js rather than forwarding `delivery` directly.
// ---------------------------------------------------------------------------

import { ORDER_STATUS } from '../constants/orderStatus.js'

const ORDERS_STORAGE_KEY = 'powerbase_orders_v1'

function loadPersistedOrders() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Fail safe on corrupted/partial entries rather than throwing.
    return parsed.filter(
      (order) => order && typeof order.orderNumber === 'string' && typeof order.id === 'string',
    )
  } catch {
    return []
  }
}

function persistOrders(orders) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Storage can fail (private browsing, quota, etc). The order still
    // exists for the current session/navigation; it just won't survive a
    // refresh. Checkout has already validated the order before this point.
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Produces order numbers like PB-20260830-4821. */
export function generateOrderNumber(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return `PB-${y}${m}${d}-${suffix}`
}

// Regenerates on the rare chance of a same-day random suffix collision with
// an order already in storage, rather than trusting one random draw.
function generateUniqueOrderNumber(existingOrders, date = new Date()) {
  let candidate = generateOrderNumber(date)
  let attempts = 0
  while (existingOrders.some((order) => order.orderNumber === candidate) && attempts < 20) {
    candidate = generateOrderNumber(date)
    attempts += 1
  }
  return candidate
}

function generateEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Builds the frontend order object. Deliberately does not include a
 * delivery fee amount anywhere except the nullable `deliveryFee` field —
 * matching PowerBase's manual delivery-fee model (see computeCartSummary in
 * src/context/CartContext.jsx). `deliveryFee` stays null until a future
 * PowerBase Admin sets it; `deliveryFeeQuotedAt`/`deliveryFeeNotes` are
 * prepared for that same future step.
 */
export function createOrder({ customerInfo, deliveryLocation, deliveryInstructions, items, vendorGroups, pricing }) {
  const existingOrders = loadPersistedOrders()
  const now = new Date().toISOString()

  return {
    id: generateId(),
    orderNumber: generateUniqueOrderNumber(existingOrders),
    customer: {
      fullName: customerInfo.fullName,
      email: customerInfo.email,
      phone: customerInfo.phone,
    },
    delivery: {
      method: deliveryLocation.method,
      latitude: deliveryLocation.latitude,
      longitude: deliveryLocation.longitude,
      address: deliveryLocation.address,
      city: deliveryLocation.city,
      area: deliveryLocation.area,
      landmark: deliveryLocation.landmark,
      instructions: deliveryInstructions || '',
    },
    items,
    vendorGroups,
    pricing: {
      subtotal: pricing.subtotal,
      platformFee: pricing.platformFee,
      amountDueNow: pricing.amountDueNow, // excludes delivery fee — quoted later
    },
    deliveryFee: null, // set later by PowerBase/Admin — never guessed here
    deliveryFeeStatus: 'PENDING_REVIEW',
    deliveryFeeQuotedAt: null,
    deliveryFeeNotes: null,
    status: ORDER_STATUS.DELIVERY_FEE_PENDING,
    createdAt: now,
    events: [
      {
        id: generateEventId(),
        status: ORDER_STATUS.PENDING,
        title: 'Order Placed',
        description: 'Your order was successfully received by PowerBase.',
        createdAt: now,
      },
      {
        id: generateEventId(),
        status: ORDER_STATUS.DELIVERY_FEE_PENDING,
        title: 'Delivery Location Submitted',
        description: 'Your delivery location is being reviewed.',
        createdAt: now,
      },
      {
        id: generateEventId(),
        status: ORDER_STATUS.DELIVERY_FEE_PENDING,
        title: 'Delivery Fee Awaiting Review',
        description: 'PowerBase will confirm your delivery fee shortly.',
        createdAt: now,
      },
    ],
  }
}

export function saveOrder(order) {
  const orders = loadPersistedOrders()
  orders.push(order)
  persistOrders(orders)
  return order
}

export function getOrders() {
  // Newest first — createdAt is an ISO string, so a plain string comparison
  // sorts correctly without parsing to Date objects.
  return [...loadPersistedOrders()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getOrderByNumber(orderNumber) {
  return loadPersistedOrders().find((order) => order.orderNumber === orderNumber) ?? null
}

/**
 * Order-number lookup for the Order Tracking Lookup page. Deliberately
 * separated from getOrderByNumber (which expects an exact stored value) so
 * the messier job of accepting raw user input — trimming, case-insensitive
 * matching — lives in exactly one place. When a real backend/API lookup
 * replaces localStorage, only this function's body needs to change; the
 * lookup page itself doesn't.
 */
export function lookupOrder(rawInput) {
  if (typeof rawInput !== 'string') return null
  const normalized = rawInput.trim().toUpperCase()
  if (!normalized) return null
  return (
    loadPersistedOrders().find((order) => order.orderNumber.toUpperCase() === normalized) ?? null
  )
}

/**
 * Applies a partial update to a stored order (e.g. once a future Admin flow
 * sets deliveryFee/status). Returns the updated order, or null if no order
 * with that number exists. No caller in this phase uses this yet — it's
 * prepared for when DELIVERY_FEE_QUOTED becomes reachable.
 */
export function updateOrder(orderNumber, updates) {
  const orders = loadPersistedOrders()
  let updated = null
  const next = orders.map((order) => {
    if (order.orderNumber !== orderNumber) return order
    updated = { ...order, ...updates }
    return updated
  })
  if (updated) persistOrders(next)
  return updated
}

/**
 * Appends an activity event to a stored order. Prepared for future
 * Admin-driven events (e.g. "Delivery Fee Confirmed") — nothing in this
 * phase calls it besides the events createOrder() seeds directly.
 */
export function addOrderEvent(orderNumber, event) {
  const order = getOrderByNumber(orderNumber)
  if (!order) return null
  const nextEvent = {
    id: generateEventId(),
    createdAt: new Date().toISOString(),
    ...event,
  }
  return updateOrder(orderNumber, { events: [...order.events, nextEvent] })
}
