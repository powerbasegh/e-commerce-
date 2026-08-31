import Icon from '../Icon.jsx'

export default function OrderDeliveryInfo({ delivery }) {
  const rows = [
    { label: 'City', value: delivery.city },
    { label: 'Area', value: delivery.area },
    { label: 'Landmark', value: delivery.landmark },
  ].filter((row) => row.value)

  return (
    <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">Delivery Information</h2>

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <Icon name="location" size={16} className="mt-0.5 shrink-0 text-pb-green" />
            <p className="text-sm text-pb-gray-text">
              <span className="text-pb-gray-muted">{row.label}: </span>
              {row.value}
            </p>
          </div>
        ))}

        {delivery.instructions && (
          <div className="flex items-start gap-3">
            <Icon name="support" size={16} className="mt-0.5 shrink-0 text-pb-green" />
            <p className="text-sm text-pb-gray-text">
              <span className="text-pb-gray-muted">Instructions: </span>
              {delivery.instructions}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
