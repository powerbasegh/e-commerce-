import Icon from './Icon.jsx'

export default function DeliveryFeeNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-pb-green-light px-3 py-2.5 text-xs text-pb-green-dark">
      <Icon name="delivery" size={15} className="mt-0.5 shrink-0" />
      <p>
        Delivery fee will be confirmed after reviewing your delivery location. You'll be notified
        before delivery is processed.
      </p>
    </div>
  )
}
