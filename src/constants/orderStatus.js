// ---------------------------------------------------------------------------
// Order status values
// ---------------------------------------------------------------------------
// This file defines the status values as clean, reusable constants so the
// frontend (and later the backend) reference the same vocabulary. Orders
// are created with DELIVERY_FEE_PENDING (see src/data/orderStorage.js);
// nothing yet transitions an order to any status beyond that — later phases
// (Admin, backend) will call updateOrder() to do so.
//
// Flow this is designed around:
//   PENDING
//     -> DELIVERY_FEE_PENDING      (order placed, PowerBase reviewing location)
//     -> DELIVERY_FEE_QUOTED       (admin has entered a delivery fee)
//     -> AWAITING_DELIVERY_PAYMENT (customer notified, hasn't paid/confirmed yet)
//     -> CONFIRMED
//     -> PROCESSING
//     -> READY_FOR_DELIVERY
//     -> OUT_FOR_DELIVERY
//     -> DELIVERED
//   (CANCELLED can happen from most states before DELIVERED)
// ---------------------------------------------------------------------------

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  DELIVERY_FEE_PENDING: 'DELIVERY_FEE_PENDING',
  DELIVERY_FEE_QUOTED: 'DELIVERY_FEE_QUOTED',
  AWAITING_DELIVERY_PAYMENT: 'AWAITING_DELIVERY_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
}

// Customer-facing status labels — intentionally worded differently from the
// raw ORDER_STATUS values above. Components must import this map rather
// than writing status text inline, so wording only ever changes in one
// place.
export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING]: 'Order Received',
  [ORDER_STATUS.DELIVERY_FEE_PENDING]: 'Delivery Location Under Review',
  [ORDER_STATUS.DELIVERY_FEE_QUOTED]: 'Delivery Fee Confirmed',
  [ORDER_STATUS.AWAITING_DELIVERY_PAYMENT]: 'Awaiting Delivery Payment',
  [ORDER_STATUS.CONFIRMED]: 'Order Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing Order',
  [ORDER_STATUS.READY_FOR_DELIVERY]: 'Ready for Delivery',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
}

// Short, one-line explanation of what the current status means for the
// customer. Shown under the status badge on the Order Details page.
export const ORDER_STATUS_DESCRIPTION = {
  [ORDER_STATUS.PENDING]: 'Your order has been received by PowerBase.',
  [ORDER_STATUS.DELIVERY_FEE_PENDING]:
    'Your order has been received. PowerBase is reviewing your delivery location to confirm the delivery fee.',
  [ORDER_STATUS.DELIVERY_FEE_QUOTED]:
    'Your delivery fee has been confirmed. Please review the delivery fee before your order proceeds.',
  [ORDER_STATUS.AWAITING_DELIVERY_PAYMENT]: 'Your delivery fee is awaiting confirmation or payment.',
  [ORDER_STATUS.CONFIRMED]: 'Your order has been confirmed and will begin processing shortly.',
  [ORDER_STATUS.PROCESSING]: 'Your order is currently being prepared.',
  [ORDER_STATUS.READY_FOR_DELIVERY]: 'Your order is packed and ready to be handed to delivery.',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Your order is on its way to you.',
  [ORDER_STATUS.DELIVERED]: 'Your order has been delivered successfully.',
  [ORDER_STATUS.CANCELLED]: 'This order has been cancelled.',
}

// ---------------------------------------------------------------------------
// Order progress timeline
// ---------------------------------------------------------------------------
// 'ORDER_PLACED' isn't one of the backend ORDER_STATUS values — it's a
// permanent first checkpoint that's implicitly true the moment an order
// object exists, so the timeline always shows it as complete. CANCELLED
// isn't part of this linear sequence; a cancelled order is rendered as its
// own state rather than a position on this timeline (see
// OrderStatusTimeline.jsx).
// ---------------------------------------------------------------------------

export const ORDER_TIMELINE_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed' },
  { key: ORDER_STATUS.DELIVERY_FEE_PENDING, label: 'Delivery Location Under Review' },
  { key: ORDER_STATUS.DELIVERY_FEE_QUOTED, label: 'Delivery Fee Confirmed' },
  { key: ORDER_STATUS.AWAITING_DELIVERY_PAYMENT, label: 'Awaiting Delivery Payment' },
  { key: ORDER_STATUS.CONFIRMED, label: 'Order Confirmed' },
  { key: ORDER_STATUS.PROCESSING, label: 'Processing' },
  { key: ORDER_STATUS.READY_FOR_DELIVERY, label: 'Ready for Delivery' },
  { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { key: ORDER_STATUS.DELIVERED, label: 'Delivered' },
]
