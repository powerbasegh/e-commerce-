import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import {
  createDefaultAccountState,
  createEmptyAddress,
  createEmptyProfile,
  generateAccountId,
} from '../data/accountModels.js'
import { createDefaultSettings } from '../data/accountModels.js'
import { getOrders } from '../data/orderStorage.js'

// ---------------------------------------------------------------------------
// Customer Account & Profile — frontend-first, backend-ready
// ---------------------------------------------------------------------------
// Authentication and a backend customer-profile API don't exist yet, so this
// is the single source of truth for account data on this device, mirroring
// the same pattern as src/context/CartContext.jsx: a reducer + localStorage
// persistence, wrapped in a hook every account page/component consumes.
//
// Swapping this for real authentication/backend profiles later only means
// changing `loadPersistedAccount`/`persistAccount` (and eventually the
// reducer's case bodies to call an API) — components using useAccount()
// don't need to change.
// ---------------------------------------------------------------------------

const ACCOUNT_STORAGE_KEY = 'powerbase_account_v1'

const AccountStateContext = createContext(null)
const AccountActionsContext = createContext(null)

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * If no profile has ever been saved on this device, gently seed full name /
 * email / phone from the customer's most recent placed order (if any) —
 * per the spec: "Optionally prefill... Do not overwrite data unexpectedly."
 * This only ever runs once, on first load with no persisted profile; it
 * never overwrites a profile the customer already has.
 */
function seedProfileFromMostRecentOrder() {
  const profile = createEmptyProfile()
  const orders = getOrders() // newest-first
  const mostRecent = orders[0]
  if (mostRecent?.customer) {
    profile.fullName = mostRecent.customer.fullName || ''
    profile.email = mostRecent.customer.email || ''
    profile.phone = mostRecent.customer.phone || ''
  }
  return profile
}

function loadPersistedAccount() {
  if (typeof window === 'undefined') return createDefaultAccountState()
  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
    if (!raw) {
      // Nothing saved yet — start from an empty account, optionally seeded
      // from the most recent local order.
      return { ...createDefaultAccountState(), profile: seedProfileFromMostRecentOrder() }
    }
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return createDefaultAccountState()

    // Fail safe on corrupted/partial data rather than throwing — each
    // field falls back independently instead of discarding the whole
    // account if one piece is malformed.
    const profile = isPlainObject(parsed.profile) ? { ...createEmptyProfile(), ...parsed.profile } : createEmptyProfile()
    const addresses = Array.isArray(parsed.addresses)
      ? parsed.addresses.filter((a) => a && typeof a.id === 'string')
      : []
    const settings = isPlainObject(parsed.settings)
      ? { ...createDefaultSettings(), ...parsed.settings }
      : createDefaultSettings()
    const notifications = Array.isArray(parsed.notifications)
      ? parsed.notifications.filter((n) => n && typeof n.id === 'string')
      : []

    return { profile, addresses, settings, notifications }
  } catch {
    return createDefaultAccountState()
  }
}

function persistAccount(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can fail (private browsing, quota, etc). The account still
    // works for the session; it just won't survive a refresh.
  }
}

function accountReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PROFILE': {
      const now = new Date().toISOString()
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
          id: state.profile.id ?? generateAccountId('cust'),
          createdAt: state.profile.createdAt ?? now,
          updatedAt: now,
        },
      }
    }

    case 'ADD_ADDRESS': {
      const address = action.payload
      // If this is the customer's first saved address, or they explicitly
      // marked it default, it becomes the default — and every other
      // address loses default status (only one default at a time).
      const makeDefault = address.isDefault || state.addresses.length === 0
      const addresses = state.addresses.map((a) => ({ ...a, isDefault: makeDefault ? false : a.isDefault }))
      return { ...state, addresses: [...addresses, { ...address, isDefault: makeDefault }] }
    }

    case 'UPDATE_ADDRESS': {
      const { id, updates } = action.payload
      let addresses = state.addresses.map((a) => (a.id === id ? { ...a, ...updates } : a))
      if (updates.isDefault) {
        addresses = addresses.map((a) => (a.id === id ? a : { ...a, isDefault: false }))
      }
      return { ...state, addresses }
    }

    case 'DELETE_ADDRESS': {
      const { id } = action.payload
      const wasDefault = state.addresses.find((a) => a.id === id)?.isDefault
      const remaining = state.addresses.filter((a) => a.id !== id)
      // If the deleted address was the default, no address is
      // automatically promoted — per spec, no fake default is invented.
      // The customer can explicitly set a new default if they want one.
      void wasDefault
      return { ...state, addresses: remaining }
    }

    case 'SET_DEFAULT_ADDRESS': {
      const { id } = action.payload
      return {
        ...state,
        addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
      }
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] }

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, read: true } : n,
        ),
      }

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    default:
      return state
  }
}

export function AccountProvider({ children }) {
  const [state, dispatch] = useReducer(accountReducer, undefined, loadPersistedAccount)

  useEffect(() => {
    persistAccount(state)
  }, [state])

  const actions = useMemo(
    () => ({
      updateProfile: (fields) => dispatch({ type: 'UPDATE_PROFILE', payload: fields }),

      addAddress: (fields) =>
        dispatch({ type: 'ADD_ADDRESS', payload: { ...createEmptyAddress(), ...fields } }),

      updateAddress: (id, updates) => dispatch({ type: 'UPDATE_ADDRESS', payload: { id, updates } }),

      deleteAddress: (id) => dispatch({ type: 'DELETE_ADDRESS', payload: { id } }),

      setDefaultAddress: (id) => dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: { id } }),

      updateSettings: (fields) => dispatch({ type: 'UPDATE_SETTINGS', payload: fields }),

      // Internal-use action: called from real events only (e.g. Checkout
      // placing an order). Never called to generate fake/random
      // notifications — see PROJECT_NOTES.md for that constraint.
      addNotification: ({ type, title, message }) =>
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: generateAccountId('notif'),
            type,
            title,
            message,
            read: false,
            createdAt: new Date().toISOString(),
          },
        }),

      markNotificationRead: (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id } }),

      markAllNotificationsRead: () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }),
    }),
    [],
  )

  return (
    <AccountStateContext.Provider value={state}>
      <AccountActionsContext.Provider value={actions}>{children}</AccountActionsContext.Provider>
    </AccountStateContext.Provider>
  )
}

/**
 * Primary hook for consuming account data. Returns profile, addresses,
 * settings, notifications, derived values, and every mutation action.
 */
export function useAccount() {
  const state = useContext(AccountStateContext)
  const actions = useContext(AccountActionsContext)

  if (state === null || actions === null) {
    throw new Error('useAccount must be used within an AccountProvider')
  }

  const defaultAddress = state.addresses.find((a) => a.isDefault) ?? null
  const unreadNotificationCount = state.notifications.filter((n) => !n.read).length
  const hasProfile = Boolean(state.profile.fullName || state.profile.email || state.profile.phone)

  return {
    ...state,
    defaultAddress,
    unreadNotificationCount,
    hasProfile,
    ...actions,
  }
}
