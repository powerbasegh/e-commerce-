import { Link } from 'react-router-dom'
import StarRating from './StarRating.jsx'
import { formatGHS } from '../data/mockData.js'

export default function ProductCard({ product, className = '' }) {
  const { name, price, oldPrice, discountPercent, rating, image } = product

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group flex w-[150px] shrink-0 flex-col rounded-card border border-pb-gray-border bg-white p-3 shadow-card transition-shadow hover:shadow-panel sm:w-[168px] ${className}`}
    >
      <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-pb-gray-bg">
        {typeof discountPercent === 'number' && discountPercent > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-pb-red px-1.5 py-0.5 text-[11px] font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"
        />
      </div>
      <p className="line-clamp-1 text-sm font-medium text-pb-gray-text">{name}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-pb-gray-text">{formatGHS(price)}</span>
        {oldPrice && (
          <span className="text-xs text-pb-gray-muted line-through">{formatGHS(oldPrice)}</span>
        )}
      </div>
      <div className="mt-1">
        <StarRating value={rating} />
      </div>
    </Link>
  )
}
