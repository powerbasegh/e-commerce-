import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { PLATFORM_FEE_GHS } from '../config/pricing.js'

// ---------------------------------------------------------------------------
// Global Cart System
// ---------------------------------------------------------------------------
// Single source of truth for the customer's cart, shared by the Homepage,
// Product Details Page, Cart Page, and (later) Checkout.
//
// Cart item shape (matches the PowerBase multi-vendor cart spec):
// {
//   productId, productName, productImage,
//   price, oldPrice,
//   quantity, stockQuantity,
//   vendor: { id, name }   // public storefront info only
// }
//
// Persistence: the cart is mirrored to localStorage under CART_STORAGE_KEY
// so it survives a refresh. This is a deliberately thin persistence layer —
// when authenticated users get a backend-persisted cart, only the
// `persistCart`/`loadPersistedCart` functions below need to change (e.g. to
// call an API instead of localStorage); the reducer, actions, and every
// component using useCart() stay the same.
// ---------------------------------------------------------------------------

const CART_STORAGE_KEY = 'powerbase_cart_v1'

const CartStateContext = createContext(null)
const CartActionsContext = createContext(null)

// Returns the usable stock number, or null when stock is missing/invalid/zero.
// Never treat missing or non-positive stock as "unlimited" — that's what let
// out-of-stock/invalid items reach a bogus 99-unit cap before.
function normalizeStock(stockQuantity) {
  return typeof stockQuantity === 'number' && Number.isFinite(stockQuantity) && stockQuantity > 0
    ? stockQuantity
    : null
}

// Clamps a requested quantity to available stock. Returns 0 when there is no
// valid stock to allow — callers must treat 0 as "cannot fulfil this
// quantity" rather than falling back to an arbitrary maximum like 99.
function clampQuantityToStock(quantity, stockQuantity) {
  const max = normalizeStock(stockQuantity)
  if (max === null) return 0
  return Math.min(Math.max(quantity, 1), max)
}

function loadPersistedCart() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Fail safe on corrupted/partial entries rather than throwing.
    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.vendor &&
        typeof item.vendor.id === 'string',
    )
  } catch {
    return []
  }
}

function persistCart(items) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage can fail (private browsing, quota, etc). The cart still
    // works for the session; it just won't survive a refresh.
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload

      // Out-of-stock or invalid-stock products must never enter the cart.
      if (normalizeStock(product.stock) === null) {
        return state
      }

      const existing = state.find((item) => item.productId === product.id)

      if (existing) {
        const nextQuantity = clampQuantityToStock(existing.quantity + quantity, existing.stockQuantity)
        return state.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: nextQuantity > 0 ? nextQuantity : item.quantity }
            : item,
        )
      }

      const newItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        oldPrice: product.oldPrice ?? null,
        quantity: clampQuantityToStock(quantity, product.stock),
        stockQuantity: product.stock,
        vendor: { id: product.vendor.id, name: product.vendor.name },
      }
      return [...state, newItem]
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.productId !== action.payload.productId)

    case 'INCREMENT':
      return state.map((item) => {
        if (item.productId !== action.payload.productId) return item
        const nextQuantity = clampQuantityToStock(item.quantity + 1, item.stockQuantity)
        // Invalid/zero stock -> can't fulfil a higher quantity. Fail safe by
        // leaving the quantity unchanged instead of allowing growth (the old
        // code allowed growth up to 99 here).
        return { ...item, quantity: nextQuantity > 0 ? nextQuantity : item.quantity }
      })

    case 'DECREMENT':
      // Decrementing only ever lowers the quantity, so it doesn't need a
      // stock ceiling — this keeps working safely even for items with
      // invalid/zero stockQuantity data.
      return state.map((item) =>
        item.productId === action.payload.productId
          ? { ...item, quantity: Math.max(item.quantity - 1, 1) }
          : item,
      )

    case 'SET_QUANTITY':
      return state.map((item) => {
        if (item.productId !== action.payload.productId) return item
        const nextQuantity = clampQuantityToStock(action.payload.quantity, item.stockQuantity)
        return { ...item, quantity: nextQuantity > 0 ? nextQuantity : item.quantity }
      })

    case 'CLEAR_CART':
      return []

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadPersistedCart)

  useEffect(() => {
    persistCart(items)
  }, [items])

  const actions = useMemo(
    () => ({
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', payload: { product, quantity } }),
      removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),
      incrementItem: (productId) => dispatch({ type: 'INCREMENT', payload: { productId } }),
      decrementItem: (productId) => dispatch({ type: 'DECREMENT', payload: { productId } }),
      setItemQuantity: (productId, quantity) =>
        dispatch({ type: 'SET_QUANTITY', payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      isInCart: (productId) => items.some((item) => item.productId === productId),
    }),
    [items],
  )

  return (
    <CartStateContext.Provider value={items}>
      <CartActionsContext.Provider value={actions}>{children}</CartActionsContext.Provider>
    </CartStateContext.Provider>
  )
}

/**
 * Primary hook for consuming the cart. Returns cart items plus derived
 * totals and every mutation action. Kept as one hook (rather than separate
 * state/actions hooks) since almost every consumer needs both.
 */
export function useCart() {
  const items = useContext(CartStateContext)
  const actions = useContext(CartActionsContext)

  if (items === null || actions === null) {
    throw new Error('useCart must be used within a CartProvider')
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return { items, totalCount, subtotal, ...actions }
}

/**
/**
 * Customer-facing grouping. PowerBase may fulfill one order through several
 * internal vendors, but the customer sees one PowerBase order/cart. Vendor
 * IDs remain in the cart only as an internal fulfillment hint.
 */
export function groupItemsByVendor(items) {
  if (!items.length) return []
  return [{
    vendor: { id: 'powerbase', name: 'PowerBase' },
    items,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }]
}

/**
 * Order summary math for the Cart Page (and later Checkout).
 *
 * PowerBase does not auto-calculate delivery fees — they're quoted
 * manually by PowerBase/Admin after reviewing the customer's delivery
 * location, item count, vendor count, etc. (see ORDER_STATUS in
 * src/constants/orderStatus.js for the DELIVERY_FEE_PENDING → 
 * DELIVERY_FEE_QUOTED flow this is designed around). So this function
 * deliberately does NOT return a delivery fee amount — only a status flag —
 * and callers must not display a guessed number.
 *
 * The platform/maintenance fee is fixed for now at PLATFORM_FEE_GHS (see
 * src/config/pricing.js) — that's the one place it's configured, not here.
 */
export function computeCartSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const platformFee = items.length === 0 ? 0 : PLATFORM_FEE_GHS
  const amountDueNow = subtotal + platformFee
  return {
    subtotal,
    platformFee,
    deliveryFeeStatus: 'PENDING_REVIEW', // delivery fee is quoted manually, never guessed here
    amountDueNow, // products + platform fee only — excludes delivery fee until quoted
  }
}
