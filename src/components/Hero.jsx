import { useState } from 'react'
import Icon from './Icon.jsx'
import { heroSlides, trustFeatures } from '../data/mockData.js'

const heroProducts = [
  ['/products/tv.svg', 'TV'],
  ['/products/earbuds-2.svg', 'Earbuds'],
  ['/products/smartwatch.svg', 'Watch'],
  ['/products/speaker.svg', 'Speaker'],
]

export default function Hero({ variant = 'desktop' }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = heroSlides[activeSlide]
  const isMobile = variant === 'mobile'

  if (isMobile) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-pb-green-darker px-5 py-6 text-white">
        <div className="relative z-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pb-green-light">PowerBase Marketplace</p>
          <h1 className="max-w-sm text-3xl font-extrabold leading-tight">
            Everything you need, <span className="text-pb-green-light">from trusted vendors</span> delivered to you.
          </h1>
          <p className="mt-3 max-w-xs text-xs text-white/75">Shop confidently with buyer protection, secure payments and reliable delivery.</p>
          <a href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-pb-green-dark">Shop Now <Icon name="arrowRight" size={15} /></a>
        </div>
        <div className="pointer-events-none absolute -bottom-6 -right-4 grid grid-cols-2 gap-2 opacity-90">
          {heroProducts.slice(0, 4).map(([src, label]) => <div key={label} className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur"><img src={src} alt={label} className="h-full w-full object-contain" /></div>)}
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[315px] overflow-hidden rounded-xl bg-pb-green-darker text-white shadow-panel">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <svg className="h-full w-full"><defs><pattern id="pb-dots" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.5" fill="white" /><circle cx="29" cy="25" r="1.2" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#pb-dots)" /></svg>
      </div>

      <div className="relative flex h-[315px] items-center justify-between px-12">
        <div className="z-10 max-w-[410px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-pb-green-light">PowerBase Marketplace</p>
          <h1 className="text-[43px] font-extrabold leading-[1.07] tracking-tight">
            Everything <span className="block text-pb-green-light">you need,</span>
            <span className="block text-[29px] font-semibold leading-tight text-white">from trusted vendors<br />delivered to you.</span>
          </h1>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/90">
            {trustFeatures.map((f) => <li key={f.id} className="flex items-center gap-1.5"><Icon name={f.icon} size={14} />{f.label}</li>)}
          </ul>
          <a href={slide.ctaHref} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-pb-green-light hover:text-pb-green-dark">
            {slide.ctaLabel} <Icon name="arrowRight" size={16} />
          </a>
        </div>

        <div className="relative h-full w-[53%] overflow-hidden">
          <div className="absolute inset-y-8 left-0 right-0 grid grid-cols-4 items-center gap-2">
            {heroProducts.map(([src, label], i) => (
              <div key={label} className={`flex h-[205px] items-center justify-center rounded-3xl ${i === 1 ? 'bg-white/5' : 'bg-white/[0.03]'} p-2`}>
                <img src={src} alt={label} className="h-full w-full object-contain drop-shadow-2xl transition-transform hover:scale-105" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-8 right-4 rounded-full border border-pb-green-light/40 bg-pb-green/30 px-4 py-2 text-xs font-bold backdrop-blur">Best Prices <span className="text-pb-green-light">Every Day!</span></div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {heroSlides.map((s, i) => <button key={s.id} onClick={() => setActiveSlide(i)} aria-label={`Show slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === activeSlide ? 'w-7 bg-white' : 'w-2 bg-white/40'}`} />)}
      </div>
    </section>
  )
}
