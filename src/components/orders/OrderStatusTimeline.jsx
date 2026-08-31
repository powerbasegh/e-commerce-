import Icon from '../Icon.jsx'
import { ORDER_STATUS, ORDER_TIMELINE_STEPS } from '../../constants/orderStatus.js'

export default function OrderStatusTimeline({ status }) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-red-100 bg-red-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-red text-white">
          <Icon name="close" size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-pb-red">This order was cancelled</p>
          <p className="text-xs text-pb-gray-muted">Contact PowerBase Support if you have questions.</p>
        </div>
      </div>
    )
  }

  // 'ORDER_PLACED' is always complete; everything else compares against the
  // order's real status. If the status isn't found (shouldn't normally
  // happen), fall back to only the first step being complete rather than
  // guessing further progress.
  const currentIndex = Math.max(
    0,
    ORDER_TIMELINE_STEPS.findIndex((step) => step.key === status),
  )

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_TIMELINE_STEPS.map((step, index) => {
        const isComplete = index < currentIndex || step.key === 'ORDER_PLACED'
        const isCurrent = index === currentIndex && step.key !== 'ORDER_PLACED'
        const isLast = index === ORDER_TIMELINE_STEPS.length - 1

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                  isComplete
                    ? 'border-pb-green bg-pb-green text-white'
                    : isCurrent
                      ? 'border-pb-green bg-white text-pb-green'
                      : 'border-pb-gray-border bg-white text-pb-gray-border'
                }`}
              >
                {isComplete ? <Icon name="checkCircle" size={13} /> : isCurrent ? '●' : '○'}
              </span>
              {!isLast && (
                <span className={`w-0.5 flex-1 ${isComplete ? 'bg-pb-green' : 'bg-pb-gray-border'}`} style={{ minHeight: 20 }} />
              )}
            </div>
            <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-medium ${
                  isComplete || isCurrent ? 'text-pb-gray-text' : 'text-pb-gray-muted'
                }`}
              >
                {step.label}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
