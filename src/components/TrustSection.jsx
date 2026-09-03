import Icon from './Icon.jsx'

const ITEMS = [
  ['secure', 'Secure Payments', 'Protected checkout and trusted payment processing'],
  ['shield', 'Buyer Protection', 'Support when an order is not as expected'],
  ['delivery', 'Reliable Delivery', 'Delivery coordination from PowerBase'],
  ['checkCircle', 'Quality Guarantee', 'Products selected with quality in mind'],
  ['support', 'Customer Support', 'We are here when you need us'],
]

export default function TrustSection() {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pb-green">SHOP WITH CONFIDENCE</p><h2 className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-pb-gray-text">Why shop with PowerBase?</h2></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map(([icon, title, text]) => (
          <div key={title} className="flex gap-3 lg:flex-col">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name={icon} size={18} /></span>
            <div><p className="text-xs font-extrabold text-pb-gray-text">{title}</p><p className="mt-1 text-[10px] leading-4 text-pb-gray-muted">{text}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}
