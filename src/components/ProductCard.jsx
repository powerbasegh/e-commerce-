import { Link } from 'react-router-dom'
import StarRating from './StarRating.jsx'
import Icon from './Icon.jsx'
import { formatGHS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product, className = '' }) {
  const { name, price, oldPrice, discountPercent, rating, reviewCount, image } = product
  const { addItem } = useCart()

  const addToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  return (
    <Link to={`/product/${product.id}`}
      className={`group flex w-[164px] shrink-0 flex-col overflow-hidden rounded-xl border border-pb-gray-border bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-pb-green/30 hover:shadow-panel sm:w-[180px] ${className}`}>
      <div className="relative aspect-square overflow-hidden bg-pb-gray-bg p-2.5">
        {typeof discountPercent === 'number' && discountPercent > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-pb-red px-2 py-1 text-[10px] font-bold text-white">-{discountPercent}%</span>
        )}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation() }} aria-label={`Add ${name} to wishlist`}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-pb-gray-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-pb-green">
          <Icon name="heart" size={15} />
        </button>
        <img src={image} alt={name} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-1 text-[13px] font-semibold text-pb-gray-text">{name}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-pb-gray-text">{formatGHS(price)}</span>
          {oldPrice && <span className="text-[10px] text-pb-gray-muted line-through">{formatGHS(oldPrice)}</span>}
        </div>
        <div className="mt-1 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1"><StarRating value={rating} /><span className="text-[9px] text-pb-gray-muted">({reviewCount ?? 0})</span></div>
          <button onClick={addToCart} aria-label={`Add ${name} to cart`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-pb-green/30 text-pb-green transition hover:bg-pb-green hover:text-white">
            <Icon name="cart" size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
