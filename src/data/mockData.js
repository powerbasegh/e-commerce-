// ---------------------------------------------------------------------------
// Site content & formatting utilities
// ---------------------------------------------------------------------------
// This file used to be a full mock data layer standing in for a product API
// (categories, flash deals, reviews, a fake current user, etc). That layer
// has been replaced by the real backend product/category API — see
// src/services/api.js (getProducts/getProduct/getCategories) and
// server/src/controllers/productController.js.
//
// What's left here is genuine static site content (trust/benefit copy that
// isn't customer or product data) and the GHS currency formatter used
// throughout the app.
// ---------------------------------------------------------------------------

export const trustSection = [
  {
    id: 'secure-payments',
    icon: 'secure',
    title: 'Secure Payments',
    description: 'Your payments are safe with us',
  },
  {
    id: 'buyer-protection',
    icon: 'shield',
    title: 'Buyer Protection',
    description: 'Get full refund if item not as described',
  },
  {
    id: 'reliable-delivery',
    icon: 'delivery',
    title: 'Reliable Delivery',
    description: 'Fast & affordable delivery to your doorstep',
  },
  {
    id: 'quality-products',
    icon: 'vendors',
    title: 'Quality Products',
    description: 'Every product is checked before it reaches you',
  },
  {
    id: 'support',
    icon: 'support',
    title: '24/7 Support',
    description: 'We are here to help',
  },
]

// Used on the product detail page's "PowerBase Buyer Protection" block.
export const buyerProtectionFeatures = [
  { id: 'secure-payments', icon: 'secure', title: 'Secure Payments', description: 'Your payment info is encrypted and protected' },
  { id: 'buyer-protection', icon: 'shield', title: 'Buyer Protection', description: 'Full refund if the item is not as described' },
  { id: 'quality-products', icon: 'vendors', title: 'Quality Products', description: 'Every product on PowerBase is reviewed for quality' },
  { id: 'reliable-delivery', icon: 'delivery', title: 'Reliable Delivery', description: 'Tracked delivery to your doorstep' },
]

export function formatGHS(amount) {
  // Guest order tracking (public API, no auth) deliberately omits some
  // financial fields for privacy/scope reasons — render those as "—"
  // instead of throwing on null.toFixed().
  if (amount == null || Number.isNaN(amount)) return '—'
  return `GH₵${amount.toFixed(2)}`
}
