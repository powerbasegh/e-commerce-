import Icon from '../Icon.jsx'

const STEPS = [
  'You place your order.',
  'PowerBase reviews your delivery location.',
  'PowerBase determines your delivery fee.',
  'You receive a notification with the confirmed fee.',
  'You\u2019re informed before delivery proceeds.',
]

export default function DeliveryFeeExplanation() {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-2.5">
        <Icon name="delivery" size={17} className="mt-0.5 shrink-0 text-pb-green" />
        <div>
          <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">How your delivery fee works</h2>
          <p className="mt-0.5 text-xs text-pb-gray-muted">
            Your delivery fee will be calculated after PowerBase reviews your delivery location.
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-2 text-sm text-pb-gray-text">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-[11px] font-bold text-pb-green-dark">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
