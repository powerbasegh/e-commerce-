import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import { lookupOrder } from '../data/orderStorage.js'

export default function OrderTrackingLookupPage() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const order = lookupOrder(value)
    if (order) {
      navigate(`/orders/${order.orderNumber}`)
      return
    }
    setError("We couldn't find an order with that order number.")
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-5 shadow-card sm:p-6">
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
          className={`rounded-lg border px-3.5 py-2.5 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none focus:ring-1 ${
            error ? 'border-pb-red focus:ring-pb-red' : 'border-pb-gray-border focus:border-pb-green focus:ring-pb-green'
          }`}
        />
        {error && <p className="text-xs text-pb-red">{error}</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
      >
        Track Order
      </button>
    </form>
  )

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header notificationCount={3} activePath="/orders/track" />
      <div className="mx-auto hidden max-w-md px-6 py-10 lg:block">{form}</div>

      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />
        <main className="px-4 py-6">{form}</main>
      </div>
    </div>
  )
}
