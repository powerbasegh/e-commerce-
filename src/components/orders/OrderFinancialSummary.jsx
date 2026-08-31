import { formatGHS } from '../../data/mockData.js'
import { computeOrderFinancials } from '../../utils/orderFinancials.js'

export default function OrderFinancialSummary({ order }) {
  const { subtotal, platformFee, deliveryFee, amountDueNow, totalIncludingDelivery } =
    computeOrderFinancials(order)

  return (
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
        <span className="font-medium text-pb-gray-text">
          {deliveryFee != null ? formatGHS(deliveryFee) : 'To be confirmed'}
        </span>
      </div>

      <div className="mt-1 flex justify-between border-t border-pb-gray-border pt-2 text-base font-bold text-pb-gray-text">
        <span>Amount Due Now</span>
        <span>{formatGHS(amountDueNow)}</span>
      </div>

      {totalIncludingDelivery != null && (
        <div className="flex justify-between text-sm text-pb-gray-muted">
          <span>Total Including Delivery</span>
          <span className="font-medium text-pb-gray-text">{formatGHS(totalIncludingDelivery)}</span>
        </div>
      )}
    </div>
  )
}
