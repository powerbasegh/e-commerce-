// ---------------------------------------------------------------------------
// Delivery details structure
// ---------------------------------------------------------------------------
// No Checkout page exists yet — this file only defines the shape the
// Checkout form will collect into, so it's decided once and reused rather
// than invented per-component later.
//
// PRIVACY: PowerBase sits between customer and vendor. A customer's exact
// address, GPS coordinates, and direct contact details are for PowerBase's
// delivery operations only — a vendor should only ever see what's needed to
// fulfil the order (see getVendorSafeDeliveryInfo below). This needs to be
// enforced again at the backend/API level once one exists; this is only the
// frontend half of that boundary.
// ---------------------------------------------------------------------------

export const DELIVERY_METHOD = {
  CURRENT_LOCATION: 'current_location',
  MANUAL_ADDRESS: 'manual_address',
}

export function createEmptyDeliveryDetails() {
  return {
    fullName: '',
    phone: '',
    email: '',
    location: {
      method: null, // one of DELIVERY_METHOD, set once the customer picks
      latitude: null,
      longitude: null,
      address: '',
      city: '',
      area: '',
      landmark: '',
    },
    deliveryInstructions: '',
  }
}

/**
 * Returns only what a vendor needs to prepare/fulfil an order — never the
 * customer's exact address, coordinates, phone, or email. Use this (or its
 * future backend equivalent) anywhere vendor-facing order data is built.
 */
export function getVendorSafeDeliveryInfo(deliveryDetails) {
  return {
    city: deliveryDetails.location.city || null,
    area: deliveryDetails.location.area || null,
  }
}
