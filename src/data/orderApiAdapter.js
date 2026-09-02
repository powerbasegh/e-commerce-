// ---------------------------------------------------------------------------
// Backend API -> frontend shape adapters
// ---------------------------------------------------------------------------
// The rest of the app (AccountContext, order pages, order components) was
// all built against the local-storage shapes defined in accountModels.js /
// orderStorage.js. Rather than rewrite every component against a new
// backend row shape, these functions translate backend responses
// (snake_case DB rows) into the exact shapes those components already
// consume — so integrating the backend is additive, not a rewrite.
// ---------------------------------------------------------------------------

import { ORDER_STATUS } from '../constants/orderStatus.js'

export function adaptApiAddress(row) {
  return {
    id: String(row.id),
    label: row.label || '',
    fullAddress: row.full_address || '',
    city: row.city || '',
    area: row.area || '',
    landmark: row.landmark || '',
    deliveryInstructions: row.delivery_instructions || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  }
}

export function adaptApiNotification(row) {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title,
    message: row.message,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  }
}

/** Order History card only needs summary fields + counts (see listMine). */
export function adaptOrderSummary(row) {
  const subtotal = Number(row.subtotal)
  const platformFee = Number(row.platform_fee)
  return {
    id: String(row.id),
    orderNumber: row.order_number,
    createdAt: row.created_at,
    status: row.status,
    itemCount: Number(row.item_count) || 0,
    vendorCount: Number(row.vendor_count) || 0,
    items: [], // summary rows don't carry line items — itemCount covers the card's needs
    vendorGroups: [],
    pricing: { subtotal, platformFee, amountDueNow: subtotal + platformFee },
    deliveryFee: row.delivery_fee == null ? null : Number(row.delivery_fee),
  }
}

/** Full order detail — from GET /orders/:orderNumber (getMine). */
export function adaptOrderDetails({ order, items, events, delivery }) {
  const subtotal = Number(order.subtotal)
  const platformFee = Number(order.platform_fee)

  const groups = new Map()
  for (const item of items) {
    const key = String(item.vendor_id)
    if (!groups.has(key)) groups.set(key, { vendor: { id: key, name: item.store_name }, items: [] })
    groups.get(key).items.push({
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.image_url || '/products/placeholder.svg',
      price: Number(item.unit_price),
      quantity: item.quantity,
    })
  }
  const vendorGroups = Array.from(groups.values()).map((g) => ({
    ...g,
    subtotal: g.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }))

  return {
    id: String(order.id),
    orderNumber: order.order_number,
    createdAt: order.created_at,
    status: order.status,
    items: items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
    vendorGroups,
    pricing: { subtotal, platformFee, amountDueNow: subtotal + platformFee },
    deliveryFee: order.delivery_fee == null ? null : Number(order.delivery_fee),
    delivery: delivery
      ? {
          method: delivery.latitude != null ? 'CURRENT_LOCATION' : 'MANUAL_ADDRESS',
          latitude: delivery.latitude,
          longitude: delivery.longitude,
          address: delivery.address,
          city: delivery.city,
          area: delivery.area,
          landmark: delivery.landmark,
          instructions: delivery.instructions || '',
        }
      : { method: 'MANUAL_ADDRESS', latitude: null, longitude: null, address: '', city: '', area: '', landmark: '', instructions: '' },
    events: events.map((e, idx) => ({
      id: `${order.id}-${idx}`,
      status: e.status,
      title: e.title,
      description: e.description,
      createdAt: e.created_at,
    })),
  }
}

/**
 * Public order-tracking response (GET /orders/track/:reference) — no auth
 * required, so this only ever contains the privacy-safe subset the backend
 * deliberately returns (see orderController.track): no phone, no exact
 * address, no GPS, no item-level detail. Used as a fallback in
 * OrderDetailsPage/OrderTrackingLookupPage for orders that aren't in this
 * browser's local storage and the visitor isn't logged in as their owner.
 */
export function adaptTrackedOrder({ order, events }) {
  return {
    id: order.order_number,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    status: order.status,
    items: [],
    vendorGroups: [],
    // Public tracking only exposes the combined grand total, not the
    // subtotal/platform-fee breakdown — those stay null rather than guessed.
    pricing: { subtotal: null, platformFee: null, amountDueNow: order.grand_total == null ? null : Number(order.grand_total) },
    deliveryFee: order.delivery_fee == null ? null : Number(order.delivery_fee),
    delivery: { method: 'MANUAL_ADDRESS', latitude: null, longitude: null, address: '', city: order.city || '', area: order.area || '', landmark: '', instructions: '' },
    events: events.map((e, idx) => ({
      id: `${order.order_number}-${idx}`,
      status: e.status,
      title: e.title,
      description: e.description,
      createdAt: e.created_at,
    })),
    isPublicTrackingOnly: true, // lets pages hide sections that need data public tracking doesn't return
  }
}

export function isKnownOrderStatus(status) {
  return Object.values(ORDER_STATUS).includes(status)
}
