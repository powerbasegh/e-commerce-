// ---------------------------------------------------------------------------
// Customer account data models (frontend-only stage)
// ---------------------------------------------------------------------------
// No authentication/backend customer-profile system exists yet, so these
// factories define the shapes AccountContext persists locally — the same
// "decide the shape once, reuse everywhere" approach as
// src/data/deliveryDetails.js and src/data/orderStorage.js. When real
// authentication/backend profiles exist, only AccountContext's persistence
// functions need to change; these shapes and every component that reads
// them stay the same.
// ---------------------------------------------------------------------------

export function generateAccountId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * customerProfile = { id, fullName, email, phone, avatar, createdAt, updatedAt }
 * Starts empty — nothing here is invented/fake data.
 */
export function createEmptyProfile() {
  return {
    id: null,
    fullName: '',
    email: '',
    phone: '',
    avatar: null,
    createdAt: null,
    updatedAt: null,
  }
}

/**
 * Saved delivery address. `isDefault` is managed by AccountContext, which
 * guarantees at most one address has isDefault: true at a time.
 */
export function createEmptyAddress() {
  return {
    id: generateAccountId('addr'),
    label: '',
    fullAddress: '',
    city: '',
    area: '',
    landmark: '',
    deliveryInstructions: '',
    latitude: null,
    longitude: null,
    isDefault: false,
    createdAt: new Date().toISOString(),
  }
}

/** Frontend-only notification-preference toggles. No real channels exist yet. */
export function createDefaultSettings() {
  return {
    emailNotifications: true,
    orderUpdates: true,
    marketingMessages: false,
  }
}

export function createDefaultAccountState() {
  return {
    profile: createEmptyProfile(),
    addresses: [],
    settings: createDefaultSettings(),
    notifications: [],
  }
}
