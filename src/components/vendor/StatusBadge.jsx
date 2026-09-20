const STYLES = {
  PENDING: 'bg-pb-amber/10 text-pb-amber',
  PROCESSING: 'bg-blue-50 text-blue-700',
  READY_FOR_DELIVERY: 'bg-purple-50 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-pb-green-light text-pb-green-dark',
  ELIGIBLE: 'bg-blue-50 text-blue-700',
  PAID: 'bg-pb-green-light text-pb-green-dark',
  HELD: 'bg-pb-amber/10 text-pb-amber',
  CANCELLED: 'bg-pb-red/10 text-pb-red',
  ACTIVE: 'bg-pb-green-light text-pb-green-dark',
  INACTIVE: 'bg-pb-gray-bg text-pb-gray-muted',
  VERIFIED: 'bg-pb-green-light text-pb-green-dark',
  UNVERIFIED: 'bg-pb-amber/10 text-pb-amber',
}

const LABELS = {
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
}

export default function StatusBadge({ status }) {
  const key = String(status || '').toUpperCase()
  const style = STYLES[key] || 'bg-pb-gray-bg text-pb-gray-muted'
  const label = LABELS[key] || key.replaceAll('_', ' ')
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}
