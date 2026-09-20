import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ORDER_STATUS } from '../../constants/orderStatus.js'
import { api } from '../../services/api.js'
import { useCart } from '../../context/CartContext.jsx'

// The order itself never tells the frontend "payment succeeded" — only
// PowerBase's backend does, via order.status flipping to CONFIRMED once a
// verified Hubtel callback (or an Admin manual confirmation) lands. This
// component's job while status is DELIVERY_FEE_QUOTED is narrower: show
// what payments.status currently is, and hand off to Hubtel's own hosted
// checkout page for anything payment-shaped. It never assumes success from
// a click, a redirect, or a closed tab — see paymentController.initiate and
// webhookController.hubtelCallback on the backend for where that's decided.
function PayNowAction({ order, secondary }) {
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  function loadPayment() {
    setLoading(true)
    api
      .getPayment(order.orderNumber)
      .then((res) => setPayment(res.payment))
      .catch(() => setPayment(null))
      .finally(() => setLoading(false))
  }

  useEffect(loadPayment, [order.orderNumber])

  async function handlePayNow() {
    setStarting(true)
    setError('')
    try {
      const res = await api.initiatePayment(order.orderNumber)
      // Hand off to Hubtel's own hosted checkout page — PowerBase does not
      // build its own card/mobile-money entry form (Phase 1I).
      window.location.href = res.checkoutUrl
    } catch (err) {
      setError(err.message || 'Could not start payment. Please try again.')
      setStarting(false)
    }
  }

  const buttonBase = 'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors text-center'
  const primary = `${buttonBase} bg-pb-green text-white hover:bg-pb-green-dark disabled:opacity-60`

  if (loading) {
    return <p className="text-sm text-pb-gray-muted">Checking payment status…</p>
  }

  // A checkout was already started and is still within its reuse window —
  // resume it rather than starting a second one.
  if (payment?.status === 'INITIATED' && payment.checkout_url) {
    return (
      <div className="flex flex-col gap-2">
        <a href={payment.checkout_url} className={primary}>
          Continue to Payment
        </a>
        <p className="text-xs text-pb-gray-muted">
          Already paid? It can take a minute to reflect here — refresh the page to check.
        </p>
        <Link to="/" className={secondary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handlePayNow} disabled={starting} className={primary}>
        {starting ? 'Starting payment…' : payment?.status === 'FAILED' ? 'Try Payment Again' : 'Pay Now'}
      </button>
      {error && <p className="text-xs text-pb-red">{error}</p>}
      {payment?.status === 'FAILED' && !error && (
        <p className="text-xs text-pb-gray-muted">Your last payment attempt wasn't completed.</p>
      )}
      <Link to="/" className={secondary}>
        Continue Shopping
      </Link>
    </div>
  )
}

export default function OrderActions({ order }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [buyingAgain, setBuyingAgain] = useState(false)

  async function handleBuyAgain() {
    setBuyingAgain(true)
    // Re-look-up each product from the real product API rather than
    // trusting the order's snapshotted price/stock, since both may have
    // changed since the order was placed. Products that no longer exist
    // (or errors) are skipped rather than failing the whole action.
    const lookups = await Promise.all(
      order.items.map((item) =>
        api
          .getProduct(item.productId)
          .then((data) => data.product)
          .catch(() => null),
      ),
    )
    lookups.forEach((product, i) => {
      if (product) addItem(product, order.items[i].quantity)
    })
    setBuyingAgain(false)
    navigate('/cart')
  }

  const buttonBase =
    'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors text-center'
  const primary = `${buttonBase} bg-pb-green text-white hover:bg-pb-green-dark`
  const secondary = `${buttonBase} border border-pb-green text-pb-green hover:bg-pb-green-light`

  if (order.status === ORDER_STATUS.DELIVERED) {
    return (
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleBuyAgain} disabled={buyingAgain} className={primary}>
          {buyingAgain ? 'Adding…' : 'Buy Again'}
        </button>
        <Link to="/" className={secondary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/" className={primary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.DELIVERY_FEE_QUOTED) {
    return <PayNowAction order={order} secondary={secondary} />
  }

  if (order.status === ORDER_STATUS.DELIVERY_FEE_PENDING) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/support" className={secondary}>
          Contact PowerBase Support
        </Link>
        <Link to="/" className={primary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/" className={secondary}>
        Continue Shopping
      </Link>
    </div>
  )
}
