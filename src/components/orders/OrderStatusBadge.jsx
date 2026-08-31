import { ORDER_STATUS, ORDER_STATUS_LABEL } from '../../constants/orderStatus.js'

const TONE_BY_STATUS = {
  [ORDER_STATUS.PENDING]: 'bg-pb-gray-bg text-pb-gray-text',
  [ORDER_STATUS.DELIVERY_FEE_PENDING]: 'bg-amber-50 text-pb-amber',
  [ORDER_STATUS.DELIVERY_FEE_QUOTED]: 'bg-blue-50 text-blue-600',
  [ORDER_STATUS.AWAITING_DELIVERY_PAYMENT]: 'bg-blue-50 text-blue-600',
  [ORDER_STATUS.CONFIRMED]: 'bg-pb-green-light text-pb-green-dark',
  [ORDER_STATUS.PROCESSING]: 'bg-pb-green-light text-pb-green-dark',
  [ORDER_STATUS.READY_FOR_DELIVERY]: 'bg-pb-green-light text-pb-green-dark',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'bg-pb-green-light text-pb-green-dark',
  [ORDER_STATUS.DELIVERED]: 'bg-pb-green text-white',
  [ORDER_STATUS.CANCELLED]: 'bg-red-50 text-pb-red',
}

export default function OrderStatusBadge({ status, size = 'md' }) {
  const tone = TONE_BY_STATUS[status] ?? 'bg-pb-gray-bg text-pb-gray-text'
  const label = ORDER_STATUS_LABEL[status] ?? status

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${tone} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      {label}
    </span>
  )
}
