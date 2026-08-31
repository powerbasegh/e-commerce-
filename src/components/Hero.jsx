import { useState } from 'react'
import Icon from './Icon.jsx'
import { heroSlides, trustFeatures } from '../data/mockData.js'

export default function Hero({ variant = 'desktop' }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = heroSlides[activeSlide]
  const isMobile = variant === 'mobile'

  return (
    <section
      className={`relative overflow-hidden rounded-card bg-pb-green-dark text-white ${
        isMobile ? 'px-5 py-6' : 'px-10 py-10'
      }`}
    >
      {/* Subtle background marketplace pattern */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        aria-hidden="true"
      >
        <pattern id={`pb-pattern-${variant}`} width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1.6" fill="white" />
          <circle cx="34" cy="20" r="1.6" fill="white" />
          <circle cx="20" cy="40" r="1.6" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#pb-pattern-${variant})`} />
      </svg>

      <div className={`relative flex ${isMobile ? 'flex-col' : 'items-center justify-between gap-8'}`}>
        <div className={isMobile ? '' : 'max-w-md'}>
          <h1 className={`font-bold leading-tight ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
            {slide.title.map((line, i) => (
              <span key={i} className={i === 1 ? 'block text-pb-green-light' : 'block'}>
                {line}
              </span>
            ))}
          </h1>

          <ul className={`mt-4 flex flex-wrap gap-x-4 gap-y-2 ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
            {trustFeatures.map((feature) => (
              <li key={feature.id} className="flex items-center gap-1.5 text-white/90">
                <Icon name={feature.icon} size={isMobile ? 14 : 15} />
                {feature.label}
              </li>
            ))}
          </ul>

          <a
            href={slide.ctaHref}
            className={`mt-5 inline-flex items-center gap-1.5 rounded-full bg-white font-semibold text-pb-green-dark transition-transform hover:scale-[1.03] ${
              isMobile ? 'px-5 py-2 text-sm' : 'px-6 py-2.5 text-sm'
            }`}
          >
            {slide.ctaLabel}
            <Icon name="chevronRight" size={16} />
          </a>
        </div>

        {!isMobile && (
          <img
            src={slide.image}
            alt="PowerBase delivery partner holding a package"
            className="h-64 w-64 shrink-0 object-contain"
          />
        )}
      </div>

      <div className="relative mt-6 flex justify-center gap-1.5">
        {heroSlides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSlide(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === activeSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
