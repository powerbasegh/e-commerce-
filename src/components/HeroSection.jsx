import Icon from './Icon.jsx'
import { trustFeatures } from '../data/mockData.js'

const heroProducts = [
  ['/products/tv.svg', 'Smart TV'],
  ['/products/earbuds-2.svg', 'Wireless Earbuds'],
  ['/products/smartwatch.svg', 'Smart Watch'],
  ['/products/speaker.svg', 'Bluetooth Speaker'],
]

// Homepage hero — solid dark-green banner with real product images on the
// right and the value proposition + trust badges on the left, per the
// customer-frontend spec. Desktop and mobile are deliberately different
// layouts rather than one squeezed responsive block.
export default function HeroSection({ variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-pb-green-darker px-5 py-6 text-white">
        <div className="relative z-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pb-green-light">PowerBase Marketplace</p>
          <h1 className="max-w-sm text-3xl font-extrabold leading-tight">
            Everything you need, <span className="text-pb-green-light">from trusted vendors</span> delivered to you.
          </h1>
          <p className="mt-3 max-w-xs text-xs text-white/75">Shop confidently with buyer protection, secure payments and reliable delivery.</p>
          <a href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-pb-green-dark">
            Shop Now <Icon name="arrowRight" size={15} />
          </a>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -right-4 grid grid-cols-2 gap-2 opacity-90">
          {heroProducts.map(([src, label]) => (
            <div key={label} className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 p-2">
              <img src={src} alt={label} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[315px] overflow-hidden rounded-xl bg-pb-green-darker text-white shadow-panel">
      <div className="relative flex h-[315px] items-center justify-between px-12">
        <div className="z-10 max-w-[410px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-pb-green-light">PowerBase Marketplace</p>
          <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight">
            Everything you need,
            <span className="block text-pb-green-light">from trusted vendors</span>
            <span className="block">delivered to you.</span>
          </h1>
          <p className="mt-4 max-w-[360px] text-sm text-white/75">
            Shop thousands of products from verified vendors across Ghana, backed by buyer protection on every order.
          </p>
          <a href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-pb-green-dark transition hover:bg-pb-green-light">
            Shop Now <Icon name="arrowRight" size={16} />
          </a>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/90">
            {trustFeatures.slice(0, 3).map((f) => (
              <li key={f.id} className="flex items-center gap-1.5">
                <Icon name={f.icon} size={14} /> {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-full w-[50%]">
          <div className="absolute inset-y-8 left-0 right-0 grid grid-cols-4 items-center gap-2">
            {heroProducts.map(([src, label], i) => (
              <div key={label} className={`flex h-[205px] items-center justify-center rounded-2xl ${i === 1 ? 'bg-white/10' : 'bg-white/5'} p-3`}>
                <img src={src} alt={label} className="h-full w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
