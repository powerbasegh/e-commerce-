import { formatGHS } from '../data/mockData.js'
import DeliveryFeeNotice from './DeliveryFeeNotice.jsx'

export default function OrderSummary({ summary, onCheckout, compact = false, hideButton = false }) {
  const { subtotal, platformFee, amountDueNow } = summary

  return (
    <div className={compact ? 'flex flex-col gap-2' : 'flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5'}>
      {!compact && <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Order Summary</h2>}

      <div className="flex flex-col gap-1.5 text-sm">
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

      {!hideButton && (
        <button
          type="button"
          onClick={onCheckout}
          className="mt-1 w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  )
}
