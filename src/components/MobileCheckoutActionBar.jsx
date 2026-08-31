import { formatGHS } from '../data/mockData.js'

export default function MobileCheckoutActionBar({ amountDueNow, onPlaceOrder, placing = false }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-pb-gray-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="min-w-0">
        <p className="text-xs text-pb-gray-muted">Amount Due Now</p>
        <p className="text-base font-bold text-pb-gray-text">{formatGHS(amountDueNow)}</p>
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={placing}
        className="flex-1 rounded-full bg-pb-green py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {placing ? 'Placing Order…' : 'Place Order'}
      </button>
    </div>
  )
}
