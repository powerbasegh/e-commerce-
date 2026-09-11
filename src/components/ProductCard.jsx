import { Link } from 'react-router-dom'
import { formatGHS } from '../data/mockData.js'

// A product card shows only what the backend actually provides: image,
// name, price, discount (derived from a real old_price), and whether it's
// in stock. No rating/review count is shown — there is no reviews table to
// back that up, and inventing one is exactly what this redesign avoids.
export default function ProductCard({ product, className = '' }) {
  const { name, price, oldPrice, discountPercent, image, stock } = product
  const outOfStock = typeof stock === 'number' && stock <= 0

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group flex w-[150px] shrink-0 flex-col rounded-card border border-pb-gray-border bg-white p-2.5 transition-shadow hover:shadow-panel sm:w-[172px] ${className}`}
    >
      <div className="relative mb-2 aspect-square overflow-hidden rounded-sm bg-pb-gray-bg">
        {typeof discountPercent === 'number' && discountPercent > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-sm bg-pb-red px-1.5 py-0.5 text-[11px] font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-1.5 top-1.5 rounded-sm bg-pb-navy/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Out of stock
          </span>
        )}
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"
        />
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-sm text-pb-gray-text">{name}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-pb-gray-text">{formatGHS(price)}</span>
        {oldPrice ? <span className="text-xs text-pb-gray-muted line-through">{formatGHS(oldPrice)}</span> : null}
      </div>
    </Link>
  )
}
