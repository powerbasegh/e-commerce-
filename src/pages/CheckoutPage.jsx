import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import MobileCheckoutActionBar from '../components/MobileCheckoutActionBar.jsx'
import CustomerInfoForm from '../components/checkout/CustomerInfoForm.jsx'
import DeliveryAddressForm from '../components/checkout/DeliveryAddressForm.jsx'
import DeliveryFeeExplanation from '../components/checkout/DeliveryFeeExplanation.jsx'
import CheckoutOrderSummary from '../components/checkout/CheckoutOrderSummary.jsx'
import CheckoutEmptyState from '../components/checkout/CheckoutEmptyState.jsx'
import { useCart, groupItemsByVendor, computeCartSummary } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createEmptyDeliveryDetails, DELIVERY_METHOD } from '../data/deliveryDetails.js'
import { createOrder, saveOrder } from '../data/orderStorage.js'
import { NOTIFICATION_TYPE, buildOrderReceivedMessage } from '../constants/notifications.js'
import { validateFullName, validateEmail, validatePhone, isRequired } from '../utils/validation.js'
import { api } from '../services/api.js'

// Builds the Checkout form's initial state, optionally prefilled from the
// customer's saved Account profile / default saved address. This only ever
// runs once (React lazy initial state) — it never silently overwrites what
// the customer types afterwards, and the customer can still edit every
// field normally. If there's nothing saved yet, this is identical to
// createEmptyDeliveryDetails().
function buildInitialCheckoutForm(profile, defaultAddress) {
  const base = createEmptyDeliveryDetails()

  if (profile?.fullName) base.fullName = profile.fullName
  if (profile?.email) base.email = profile.email
  if (profile?.phone) base.phone = profile.phone

  if (defaultAddress) {
    base.location = {
      ...base.location,
      method: DELIVERY_METHOD.MANUAL_ADDRESS,
      address: defaultAddress.fullAddress || '',
      city: defaultAddress.city || '',
      area: defaultAddress.area || '',
      landmark: defaultAddress.landmark || '',
      latitude: defaultAddress.latitude ?? null,
      longitude: defaultAddress.longitude ?? null,
    }
    base.deliveryInstructions = defaultAddress.deliveryInstructions || ''
  }

  return base
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  const { profile, defaultAddress, addNotification, refreshFromApi } = useAccount()
  const { isAuthenticated } = useAuth()

  const [form, setForm] = useState(() => buildInitialCheckoutForm(profile, defaultAddress))
  // Captured once on mount — used only to show a small "prefilled" note,
  // never re-evaluated as the customer edits the form.
  const [wasPrefilled] = useState(() => Boolean(profile?.fullName || defaultAddress))
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')

  const vendorGroups = groupItemsByVendor(items)
  const summary = computeCartSummary(items)

  function updateField(field, fieldValue) {
    setForm((prev) => ({ ...prev, [field]: fieldValue }))
  }

  function updateLocationField(field, fieldValue) {
    setForm((prev) => ({ ...prev, location: { ...prev.location, [field]: fieldValue } }))
  }

  function handleCoords(latitude, longitude) {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, latitude, longitude, method: DELIVERY_METHOD.CURRENT_LOCATION },
    }))
  }

  function validate() {
    const nextErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      address: isRequired(form.location.address) ? null : 'Delivery address is required',
      city: isRequired(form.location.city) ? null : 'City is required',
      area: isRequired(form.location.area) ? null : 'Area is required',
      confirm: confirmChecked ? null : 'Please confirm you understand the delivery-fee process',
    }
    const cleaned = Object.fromEntries(Object.entries(nextErrors).filter(([, v]) => v))
    setErrors(cleaned)
    return Object.keys(cleaned).length === 0
  }

  async function handlePlaceOrder() {
    // Belt-and-braces: the page-level guard below already prevents reaching
    // this with an empty cart, but never place an order without items.
    if (items.length === 0) return
    if (!validate()) return

    setPlaceError('')
    setPlacing(true)

    // Authenticated customers place a real, server-authoritative order —
    // the backend re-verifies products/prices/stock and computes totals
    // itself (never trusts what the browser sends); it also creates the
    // "order received" notification server-side. Guests keep the exact
    // local-storage flow this project already had, unchanged.
    if (isAuthenticated) {
      try {
        const { order } = await api.createOrder({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          delivery: {
            address: form.location.address,
            city: form.location.city,
            area: form.location.area,
            landmark: form.location.landmark,
            latitude: form.location.latitude,
            longitude: form.location.longitude,
            instructions: form.deliveryInstructions,
          },
          customer: { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() },
        })
        clearCart()
        // Best-effort — pick up the notification the backend just created.
        // Checkout has already succeeded either way, so a refresh failure
        // here shouldn't block navigating to the success page.
        refreshFromApi?.().catch(() => {})
        navigate(`/order-success/${order.orderNumber}`)
      } catch (err) {
        setPlaceError(err.message || 'Could not place your order. Please try again.')
        setPlacing(false)
      }
      return
    }

    const order = createOrder({
      customerInfo: { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() },
      deliveryLocation: form.location,
      deliveryInstructions: form.deliveryInstructions,
      items,
      vendorGroups,
      pricing: summary,
    })
    saveOrder(order)
    // Real event → real in-app notification (never fabricated), matching
    // the exact "ORDER UPDATE / Your order ... has been received." example.
    addNotification({
      type: NOTIFICATION_TYPE.ORDER_UPDATE,
      title: `Order ${order.orderNumber}`,
      message: buildOrderReceivedMessage({ orderNumber: order.orderNumber }),
    })
    clearCart()
    navigate(`/order-success/${order.orderNumber}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-pb-gray-bg">
        <Header notificationCount={3} activePath="" />
        <div className="mx-auto hidden max-w-[1400px] px-6 py-6 lg:block">
          <CheckoutEmptyState />
        </div>
        <div className="lg:hidden">
          <MobileHeader notificationCount={3} />
          <main className="px-4 pt-3 pb-6">
            <CheckoutEmptyState />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={3} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-5 px-6 py-6 lg:flex">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
          <h1 className="text-xl font-bold text-pb-gray-text">Checkout</h1>
          {wasPrefilled && (
            <p className="text-xs text-pb-gray-muted">
              Prefilled from your saved profile/address — feel free to edit anything below.
            </p>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
          <div className="flex flex-col gap-4">
            <CustomerInfoForm
              value={{ fullName: form.fullName, email: form.email, phone: form.phone }}
              errors={errors}
              onChange={updateField}
            />
            <DeliveryAddressForm
              location={form.location}
              errors={errors}
              onFieldChange={updateLocationField}
              onCoords={handleCoords}
              instructions={form.deliveryInstructions}
              onInstructionsChange={(v) => updateField('deliveryInstructions', v)}
            />
            <DeliveryFeeExplanation />
          </div>

          <div className="sticky top-6 flex flex-col gap-3">
            {placeError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-pb-red">{placeError}</p>
            )}
            <CheckoutOrderSummary
              items={items}
              summary={summary}
              confirmChecked={confirmChecked}
              onToggleConfirm={setConfirmChecked}
              confirmError={errors.confirm}
              onPlaceOrder={handlePlaceOrder}
              placing={placing}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — sticky Place Order bar replaces the bottom tab nav, */}
      {/* same pattern as Cart/Product Details                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />

        <main className="flex flex-col gap-4 px-4 pb-28 pt-3">
          <h1 className="text-lg font-bold text-pb-gray-text">Checkout</h1>
          {wasPrefilled && (
            <p className="-mt-2 text-xs text-pb-gray-muted">
              Prefilled from your saved profile/address — feel free to edit anything below.
            </p>
          )}

          <CustomerInfoForm
            value={{ fullName: form.fullName, email: form.email, phone: form.phone }}
            errors={errors}
            onChange={updateField}
          />
          <DeliveryAddressForm
            location={form.location}
            errors={errors}
            onFieldChange={updateLocationField}
            onCoords={handleCoords}
            instructions={form.deliveryInstructions}
            onInstructionsChange={(v) => updateField('deliveryInstructions', v)}
          />
          <DeliveryFeeExplanation />
          {placeError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-pb-red">{placeError}</p>
          )}
          <CheckoutOrderSummary
            items={items}
            summary={summary}
            confirmChecked={confirmChecked}
            onToggleConfirm={setConfirmChecked}
            confirmError={errors.confirm}
            onPlaceOrder={handlePlaceOrder}
            placing={placing}
            collapsibleItems
            hideButton
          />
        </main>

        <MobileCheckoutActionBar amountDueNow={summary.amountDueNow} onPlaceOrder={handlePlaceOrder} placing={placing} />
      </div>
    </div>
  )
}
