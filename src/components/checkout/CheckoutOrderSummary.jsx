import { useState } from 'react'
import Icon from '../Icon.jsx'
import PowerBaseOrderItems from '../PowerBaseOrderItems.jsx'
import DeliveryFeeNotice from '../DeliveryFeeNotice.jsx'
import { formatGHS } from '../../data/mockData.js'

export default function CheckoutOrderSummary({
  items = [],
  summary,
  confirmChecked,
  onToggleConfirm,
  confirmError,
  onPlaceOrder,
  placing = false,
  collapsibleItems = false,
  hideButton = false,
}) {
  const [itemsExpanded, setItemsExpanded] = useState(!collapsibleItems)
  const { subtotal, platformFee, amountDueNow } = summary

  return (
    <div className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Order Summary</h2>

      {collapsibleItems && (
        <button
          type="button"
          onClick={() => setItemsExpanded((v) => !v)}
          className="flex items-center justify-between text-sm font-medium text-pb-green"
        >
          {itemsExpanded ? 'Hide order details' : 'View order details'}
          <Icon name="chevronDown" size={14} className={`transition-transform ${itemsExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {itemsExpanded && (
        <div className="flex flex-col gap-3">
          <PowerBaseOrderItems items={items} compact />
        </div>
      )}

      <div className="flex flex-col gap-1.5 border-t border-pb-gray-border pt-3 text-sm">
        <div className="flex justify-between text-pb-gray-muted">
          <span>Product Subtotal</span>
          <span className="font-medium text-pb-gray-text">{formatGHS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-pb-gray-muted">
          <span>Platform / Maintenance Fee</span>
          <span className="font-medium text-pb-gray-text">{formatGHS(platformFee)}</span>
        </div>
        <div className="flex justify-between text-pb-gray-muted">
          <span>Delivery Fee</span>
          <span className="font-medium text-pb-gray-text">To be confirmed</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-pb-gray-border pt-2 text-base font-bold text-pb-gray-text">
          <span>Amount Due Now</span>
          <span>{formatGHS(amountDueNow)}</span>
        </div>
      </div>

      <DeliveryFeeNotice />

      <label className="flex items-start gap-2.5 text-xs text-pb-gray-text">
        <input
          type="checkbox"
          checked={confirmChecked}
          onChange={(e) => onToggleConfirm(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-pb-gray-border accent-pb-green"
        />
        <span>
          I understand that the delivery fee will be communicated to me after my delivery location is
          reviewed.
        </span>
      </label>
      {confirmError && <p className="-mt-1.5 text-xs text-pb-red">{confirmError}</p>}

      {!hideButton && (
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={placing}
          className="mt-1 w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {placing ? 'Placing Order…' : 'Place Order'}
        </button>
      )}
    </div>
  )
}
