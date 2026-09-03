import Icon from './Icon.jsx'

const heroProducts = [
  ['/products/tv.svg', 'Smart TV'],
  ['/products/earbuds-2.svg', 'Wireless Earbuds'],
  ['/products/smartwatch.svg', 'Smart Watch'],
  ['/products/speaker.svg', 'Bluetooth Speaker'],
]

const heroTrust = [
  { icon: 'secure', title: 'Secure Payments', text: '100% secure checkout' },
  { icon: 'shield', title: 'Buyer Protection', text: 'Shop with confidence' },
  { icon: 'truck', title: 'Reliable Delivery', text: 'Fast & on-time delivery' },
]

// Homepage hero — solid dark-green banner with real product images on the
// right and the value proposition + trust badges on the left, per the
// customer-frontend spec. Desktop and mobile are deliberately different
// layouts rather than one squeezed responsive block.
export default function HeroSection({ variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <section className="overflow-hidden rounded-2xl bg-pb-green-dark px-5 pb-5 pt-6 text-white">
        <h1 className="text-[22px] font-extrabold leading-tight">
          Everything you need, <span className="text-pb-green-light">from trusted brands</span> delivered to you.
        </h1>
        <p className="mt-3 max-w-xs text-xs text-white/75">
          Shop the best quality products at the best prices with PowerBase.
        </p>
        <a href="/shop" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-pb-green-dark">
          Shop Now <Icon name="chevronRight" size={15} />
        </a>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {heroProducts.map(([src, label]) => (
            <div key={label} className="flex h-12 items-center justify-center rounded-lg bg-white/10 p-1.5">
              <img src={src} alt={label} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <section className="relative min-h-[250px] overflow-hidden rounded-xl bg-pb-green-dark text-white shadow-panel">
        <div className="relative flex h-full min-h-[250px] items-center justify-between gap-5 px-8 py-6">
          <div className="z-10 max-w-[350px]">
            <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-tight">
              Everything you need,
              <span className="block text-pb-green-light">from trusted brands</span>
              <span className="block">delivered to you.</span>
            </h1>
            <p className="mt-3 max-w-[320px] text-[13px] text-white/75">
              Shop the best quality products at the best prices with PowerBase.
            </p>
            <a
              href="/shop"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-pb-green-dark transition hover:bg-pb-green-light"
            >
              Shop Now <Icon name="chevronRight" size={16} />
            </a>
          </div>

          <div className="relative hidden h-full w-[43%] items-center md:flex">
            <div className="grid w-full grid-cols-4 items-center gap-2">
              {heroProducts.map(([src, label], i) => (
                <div
                  key={label}
                  className="flex h-[128px] items-center justify-center p-1"
                >
                  <img src={src} alt={label} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-6 gap-y-3 rounded-xl border border-pb-gray-border bg-white px-4 py-3 shadow-card">
        {heroTrust.map((item) => (
          <div key={item.title} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={item.icon} size={15} />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-pb-gray-text">{item.title}</p>
              <p className="text-[10px] text-pb-gray-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
