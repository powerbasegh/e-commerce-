import Icon from './Icon.jsx'

const heroTrust = [
  { icon: 'secure', title: 'Secure Payments', text: '100% secure checkout' },
  { icon: 'shield', title: 'Buyer Protection', text: 'Shop with confidence' },
  { icon: 'truck', title: 'Reliable Delivery', text: 'Fast & on-time delivery' },
]

export default function HeroSection({ variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <section className="overflow-hidden rounded-xl bg-pb-green-dark px-4 py-4 text-white">
        <h1 className="text-[18px] font-extrabold leading-tight">
          Everything you need, <span className="text-pb-green-light">from trusted brands</span> delivered to you.
        </h1>
        <p className="mt-2 max-w-xs text-[10px] text-white/75">
          Shop quality products at great prices with PowerBase.
        </p>
        <a href="/shop" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-[11px] font-bold text-pb-green-dark">
          Shop Now <Icon name="chevronRight" size={13} />
        </a>
      </section>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <section className="relative min-h-[205px] overflow-hidden rounded-lg bg-pb-green-dark text-white">
        <div className="flex min-h-[205px] items-center px-6 py-5">
          <div className="max-w-[430px]">
            <h1 className="text-[22px] font-extrabold leading-[1.08] tracking-tight xl:text-[24px]">
              Everything you need,
              <span className="block text-pb-green-light">from trusted brands</span>
              <span className="block">delivered to you.</span>
            </h1>
            <p className="mt-2.5 max-w-[310px] text-[10px] leading-relaxed text-white/75">
              Shop quality products at great prices with PowerBase.
            </p>
            <a href="/shop" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-[11px] font-bold text-pb-green-dark transition hover:bg-pb-green-light">
              Shop Now <Icon name="chevronRight" size={14} />
            </a>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 gap-y-2 rounded-lg border border-pb-gray-border bg-white px-3 py-2">
        {heroTrust.map((item) => (
          <div key={item.title} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={item.icon} size={11} />
            </span>
            <div className="leading-tight">
              <p className="text-[9px] font-bold text-pb-gray-text">{item.title}</p>
              <p className="text-[8px] text-pb-gray-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
