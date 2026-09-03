import Icon from './Icon.jsx'

export default function DeliveryInfo({ location = 'Accra, Ghana' }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Delivery</h2>

      <div className="flex items-start gap-3">
        <Icon name="delivery" size={17} className="mt-0.5 shrink-0 text-pb-green" />
        <div className="text-sm">
          <p className="text-pb-gray-text">
            Deliver to <span className="font-medium">{location}</span>
          </p>
          <p className="text-xs text-pb-gray-muted">Estimated delivery: 2 – 4 business days</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Icon name="secure" size={17} className="mt-0.5 shrink-0 text-pb-green" />
        <div className="text-sm">
          <p className="text-pb-gray-text">
            Delivery fee: <span className="font-medium">To be confirmed</span>
          </p>
          <p className="text-xs text-pb-gray-muted">
            Your delivery fee will be calculated after PowerBase reviews your delivery location.
          </p>
        </div>
      </div>
    </section>
  )
}
