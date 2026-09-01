import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  createDefaultAccountState,
  createEmptyAddress,
  createEmptyProfile,
  generateAccountId,
} from '../data/accountModels.js'
import { createDefaultSettings } from '../data/accountModels.js'
import { getOrders } from '../data/orderStorage.js'
import { useAuth } from './AuthContext.jsx'
import { api } from '../services/api.js'
import { adaptApiAddress, adaptApiNotification } from '../data/orderApiAdapter.js'

// ---------------------------------------------------------------------------
// Customer Account & Profile — frontend-first, backend-ready
// ---------------------------------------------------------------------------
// The account UI remains locally resilient while backend authentication/profile APIs are integrated, so this
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

    // Replaces addresses/notifications with the authenticated customer's
    // real backend data (fetched on login — see AccountProvider's effect
    // below). Profile/settings are left alone: there's no backend
    // update-profile endpoint yet, and settings are still frontend-only by
    // design, so those two stay locally persisted even when logged in.
    // Fired on logout, after a session that was synced with the backend.
    // Clears addresses/notifications rather than leaving the previous
    // account's data visible (and persisted to this device's localStorage)
    // to whoever uses the browser next — a real customer-isolation concern,
    // not just cosmetic. Profile/settings are cleared too, for the same
    // reason: they may have been seeded from that account.
    case 'RESET_ACCOUNT':
      return createDefaultAccountState()

    case 'HYDRATE_FROM_API':
      // Payload may include just one of addresses/notifications (address
      // CRUD actions only refetch addresses) — only replace what's given,
      // never wipe the other field to an empty array by omission.
      return {
        ...state,
        addresses: action.payload.addresses ?? state.addresses,
        notifications: action.payload.notifications ?? state.notifications,
      }

    default:
      return state
  }
}

export function AccountProvider({ children }) {
  const [state, dispatch] = useReducer(accountReducer, undefined, loadPersistedAccount)
  const { isAuthenticated, user } = useAuth()
  // Tracks whether addresses/notifications currently reflect the backend
  // (true) or local guest storage (false) — CRUD actions below branch on
  // this so a guest's flow is completely unchanged.
  const [syncedWithApi, setSyncedWithApi] = useState(false)
  // Tracks whether the *previous* render was authenticated, so the reset
  // below only fires on an actual login->logout transition — never on
  // first mount for a guest who was never logged in (that would wipe their
  // legitimate local guest data for no reason).
  const wasAuthenticated = useRef(false)

  useEffect(() => {
    persistAccount(state)
  }, [state])

  // On login, pull the customer's real addresses/notifications from the
  // backend and replace whatever was in local storage — a logged-in
  // customer's data should come from their account, not this device's
  // guest cache. On logout, clear that account's data (see RESET_ACCOUNT)
  // rather than leaving it visible to whoever uses the browser next.
  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      setSyncedWithApi(false)
      if (wasAuthenticated.current) {
        dispatch({ type: 'RESET_ACCOUNT' })
      }
      wasAuthenticated.current = false
      return
    }
    wasAuthenticated.current = true
    Promise.all([api.getAddresses(), api.getNotifications()])
      .then(([addrData, notifData]) => {
        if (cancelled) return
        dispatch({
          type: 'HYDRATE_FROM_API',
          payload: {
            addresses: (addrData.addresses || []).map(adaptApiAddress),
            notifications: (notifData.notifications || []).map(adaptApiNotification),
          },
        })
        setSyncedWithApi(true)
      })
      .catch(() => {
        // Leave whatever was already in state (likely stale/empty) rather
        // than blocking the UI — CRUD actions still gate on syncedWithApi,
        // so if this failed we simply stay in local mode for this session.
        setSyncedWithApi(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // Once logged in, if no local profile has ever been saved, seed the
  // editable profile form from the authenticated user's real account
  // fields — never overwrites a profile the customer already has.
  useEffect(() => {
    if (isAuthenticated && user && !state.profile.fullName && !state.profile.email) {
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { fullName: user.fullName || '', email: user.email || '', phone: user.phone || '' },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const actions = useMemo(
    () => ({
      // No backend profile-update endpoint exists yet (only GET
      // /auth/profile) — profile editing stays local-only for now, exactly
      // as before, even when logged in. See PROJECT_NOTES.md.
      updateProfile: (fields) => dispatch({ type: 'UPDATE_PROFILE', payload: fields }),

      async addAddress(fields) {
        if (isAuthenticated && syncedWithApi) {
          await api.createAddress({
            label: fields.label,
            full_address: fields.fullAddress,
            city: fields.city,
            area: fields.area,
            landmark: fields.landmark,
            delivery_instructions: fields.deliveryInstructions,
            latitude: fields.latitude,
            longitude: fields.longitude,
            is_default: fields.isDefault,
          })
          const data = await api.getAddresses()
          dispatch({ type: 'HYDRATE_FROM_API', payload: { addresses: data.addresses.map(adaptApiAddress) } })
          return
        }
        dispatch({ type: 'ADD_ADDRESS', payload: { ...createEmptyAddress(), ...fields } })
      },

      async updateAddress(id, updates) {
        if (isAuthenticated && syncedWithApi) {
          const current = state.addresses.find((a) => a.id === id)
          await api.updateAddress(id, {
            label: updates.label ?? current?.label,
            full_address: updates.fullAddress ?? current?.fullAddress,
            city: updates.city ?? current?.city,
            area: updates.area ?? current?.area,
            landmark: updates.landmark ?? current?.landmark,
            delivery_instructions: updates.deliveryInstructions ?? current?.deliveryInstructions,
            latitude: updates.latitude ?? current?.latitude,
            longitude: updates.longitude ?? current?.longitude,
            is_default: updates.isDefault ?? current?.isDefault,
          })
          const data = await api.getAddresses()
          dispatch({ type: 'HYDRATE_FROM_API', payload: { addresses: data.addresses.map(adaptApiAddress) } })
          return
        }
        dispatch({ type: 'UPDATE_ADDRESS', payload: { id, updates } })
      },

      async deleteAddress(id) {
        if (isAuthenticated && syncedWithApi) {
          await api.deleteAddress(id)
          const data = await api.getAddresses()
          dispatch({ type: 'HYDRATE_FROM_API', payload: { addresses: data.addresses.map(adaptApiAddress) } })
          return
        }
        dispatch({ type: 'DELETE_ADDRESS', payload: { id } })
      },

      async setDefaultAddress(id) {
        if (isAuthenticated && syncedWithApi) {
          await api.setDefaultAddress(id)
          const data = await api.getAddresses()
          dispatch({ type: 'HYDRATE_FROM_API', payload: { addresses: data.addresses.map(adaptApiAddress) } })
          return
        }
        dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: { id } })
      },

      updateSettings: (fields) => dispatch({ type: 'UPDATE_SETTINGS', payload: fields }),

      // Internal-use action: called from real events only (e.g. Checkout
      // placing an order for a guest). Never called to generate
      // fake/random notifications — see PROJECT_NOTES.md for that
      // constraint. When logged in, the backend creates the equivalent
      // notification itself (see server orderController.createOrder /
      // adminController.updateDeliveryFee), so this is guest-only.
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

      async markNotificationRead(id) {
        if (isAuthenticated && syncedWithApi) {
          await api.markNotificationRead(id)
        }
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id } })
      },

      async markAllNotificationsRead() {
        if (isAuthenticated && syncedWithApi) {
          await api.markAllNotificationsRead()
        }
        dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })
      },

      // Re-fetches addresses/notifications from the backend on demand
      // (e.g. after Checkout places an authenticated order, to pick up the
      // order-received notification the backend just created).
      async refreshFromApi() {
        if (!isAuthenticated) return
        const [addrData, notifData] = await Promise.all([api.getAddresses(), api.getNotifications()])
        dispatch({
          type: 'HYDRATE_FROM_API',
          payload: {
            addresses: addrData.addresses.map(adaptApiAddress),
            notifications: notifData.notifications.map(adaptApiNotification),
          },
        })
      },
    }),
    [isAuthenticated, syncedWithApi, state.addresses],
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
