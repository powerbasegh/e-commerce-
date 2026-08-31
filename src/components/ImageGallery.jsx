import { useState } from 'react'

export default function ImageGallery({ images, productName, discountPercent }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex] ?? images[0]

  return (
    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
      {/* Thumbnails */}
      <div className="flex gap-2 sm:order-1 sm:flex-col lg:order-none lg:flex-row xl:order-1 xl:flex-col">
        {images.map((img, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${productName}`}
              aria-pressed={isActive}
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-pb-gray-bg p-1.5 transition-colors ${
                isActive ? 'border-pb-green ring-1 ring-pb-green' : 'border-pb-gray-border hover:border-pb-green/50'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-contain" />
            </button>
          )
        })}
      </div>

      {/* Main image */}
      <div className="relative order-first flex aspect-square flex-1 items-center justify-center rounded-card border border-pb-gray-border bg-pb-gray-bg sm:order-none">
        {typeof discountPercent === 'number' && discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-pb-red px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        <img src={activeImage} alt={productName} className="h-full w-full object-contain p-8" />
      </div>
    </div>
  )
}
