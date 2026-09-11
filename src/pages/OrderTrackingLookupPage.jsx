import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../services/api.js'
import { formatGHS } from '../data/mockData.js'
import { ORDER_STATUS_LABEL } from '../constants/orderStatus.js'

// Public order tracking — no login required. Calls the real backend
// tracking endpoint (server/src/controllers/orderController.js `track`),
// which deliberately returns only limited, non-sensitive fields (status,
// city/area, delivery fee, totals, event timeline) — never the full
// address, items, or anything vendor-related. Full order detail still
// requires signing in (see OrderDetailsPage).
export default function OrderTrackingLookupPage() {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.trackOrder(value.trim())
      setResult(data)
    } catch (err) {
      setError(err.message || "We couldn't find an order with that order number.")
    } finally {
      setLoading(false)
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-5 sm:p-6">
      <div>
        <h1 className="text-lg font-bold text-pb-gray-text sm:text-xl">Track Your Order</h1>
        <p className="mt-1 text-sm text-pb-gray-muted">
          Enter your PowerBase order number to check the latest status of your order.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="orderNumber" className="text-sm font-medium text-pb-gray-text">
          Order Number
        </label>
        <input
          id="orderNumber"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError('')
          }}
          placeholder="PB-20260830-4821"
          className={`rounded-sm border px-3.5 py-2.5 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none focus:ring-1 ${
            error ? 'border-pb-red focus:ring-pb-red' : 'border-pb-gray-border focus:border-pb-green focus:ring-pb-green'
          }`}
        />
        {error && <p className="text-xs text-pb-red">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark disabled:opacity-60"
      >
        {loading ? 'Searching…' : 'Track Order'}
      </button>

      {result && <TrackingResult data={result} />}
    </form>
  )

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="/orders/track" />
      <div className="mx-auto hidden max-w-md px-6 py-10 lg:block">{form}</div>

      <div className="lg:hidden">
        <MobileHeader />
        <main className="px-4 py-6">{form}</main>
      </div>
    </div>
  )
}

function TrackingResult({ data }) {
  const { order, events } = data
  return (
    <div className="flex flex-col gap-3 border-t border-pb-gray-border pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-pb-gray-text">#{order.order_number}</span>
        <span className="rounded-sm bg-pb-green-light px-2 py-1 text-xs font-semibold text-pb-green-dark">
          {ORDER_STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-pb-gray-muted">Delivery Fee</p>
          <p className="font-medium text-pb-gray-text">{formatGHS(order.delivery_fee)}</p>
        </div>
        <div>
          <p className="text-xs text-pb-gray-muted">Order Total</p>
          <p className="font-medium text-pb-gray-text">{formatGHS(order.grand_total)}</p>
        </div>
        {order.city && (
          <div className="col-span-2">
            <p className="text-xs text-pb-gray-muted">Delivering to</p>
            <p className="font-medium text-pb-gray-text">
              {order.area ? `${order.area}, ` : ''}
              {order.city}
            </p>
          </div>
        )}
      </div>

      {events?.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-pb-gray-border pt-3">
          {events.map((event, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Icon name="checkCircle" size={14} className="mt-0.5 shrink-0 text-pb-green" />
              <div>
                <p className="font-medium text-pb-gray-text">{event.title}</p>
                {event.description && <p className="text-pb-gray-muted">{event.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link to="/login" className="text-xs font-semibold text-pb-green hover:text-pb-green-dark">
        Sign in to see full order details
      </Link>
    </div>
  )
}
