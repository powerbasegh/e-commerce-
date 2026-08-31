// ---------------------------------------------------------------------------
// Notification architecture (not connected to a real service yet)
// ---------------------------------------------------------------------------
// No email/WhatsApp/SMS integration exists in this project. This file exists
// so the *shape* of a notification is decided now — channel names and a
// message-building function — rather than invented ad hoc later. Nothing
// here sends anything; `buildDeliveryFeeQuotedMessage` only returns text.
//
// When real sending is wired up, a dispatch function (e.g.
// `sendOrderNotification(channel, to, message)`) would live here and call
// out to whichever provider PowerBase picks per channel — that's a backend
// concern, not something to fake on the frontend.
// ---------------------------------------------------------------------------

export const NOTIFICATION_CHANNEL = {
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  IN_APP: 'IN_APP',
}

// Notification *types* shown in the Account Notification Center
// (src/pages/AccountNotificationsPage.jsx). Only IN_APP notifications are
// actually created right now (e.g. on order placement) — the others are
// prepared vocabulary for when PowerBase/Admin can trigger them.
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: 'ORDER_UPDATE',
  DELIVERY_FEE_UPDATE: 'DELIVERY_FEE_UPDATE',
  PAYMENT_UPDATE: 'PAYMENT_UPDATE',
  DELIVERY_UPDATE: 'DELIVERY_UPDATE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
}

export const NOTIFICATION_TYPE_LABEL = {
  [NOTIFICATION_TYPE.ORDER_UPDATE]: 'Order Update',
  [NOTIFICATION_TYPE.DELIVERY_FEE_UPDATE]: 'Delivery Fee Update',
  [NOTIFICATION_TYPE.PAYMENT_UPDATE]: 'Payment Update',
  [NOTIFICATION_TYPE.DELIVERY_UPDATE]: 'Delivery Update',
  [NOTIFICATION_TYPE.ANNOUNCEMENT]: 'PowerBase Announcement',
}

/** Pure string formatting for the in-app notification created when an
 * order is placed — matches the customer-facing example in the spec. */
export function buildOrderReceivedMessage({ orderNumber }) {
  return `Your order ${orderNumber} has been received.`
}

/**
 * Builds the customer-facing message for when PowerBase/Admin has quoted a
 * delivery fee. Pure string formatting only — not tied to any channel or
 * sending mechanism.
 */
export function buildDeliveryFeeQuotedMessage({ customerName, orderNumber, deliveryFeeGHS }) {
  return `Hello ${customerName}, your PowerBase order #${orderNumber} has been reviewed.\n\nYour delivery fee is GH₵${deliveryFeeGHS.toFixed(
    2,
  )}.\n\nPlease review your order and complete the required payment to continue processing.`
}
