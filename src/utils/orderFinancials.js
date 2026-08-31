// ---------------------------------------------------------------------------
// Order financial summary
// ---------------------------------------------------------------------------
// Pure function, no component-specific formatting — takes a stored order
// and returns the numbers a UI needs. Kept separate from orderStorage.js
// since this is display math, not persistence.
//
// order.pricing.platformFee is already the value computed from
// PLATFORM_FEE_GHS (src/config/pricing.js) at the moment the order was
// placed — this function does not re-import or re-hardcode that constant,
// it only reads what's already on the order.
// ---------------------------------------------------------------------------

export function computeOrderFinancials(order) {
  const { subtotal, platformFee, amountDueNow } = order.pricing
  const deliveryFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : null

  return {
    subtotal,
    platformFee,
    deliveryFee, // null until PowerBase/Admin confirms it
    amountDueNow, // subtotal + platformFee only, always known
    totalIncludingDelivery: deliveryFee != null ? amountDueNow + deliveryFee : null,
  }
}
