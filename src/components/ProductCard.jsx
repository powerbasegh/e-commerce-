import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { formatGHS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product, className = '' }) {
  const { name, price, oldPrice, discountPercent, rating, reviewCount, image, category } = product
  const { addItem, isInCart } = useCart()
  const [wishlisted, setWishlisted] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  function handleAddToCart(e) {
    e.preventDefault(); e.stopPropagation()
    addItem(product, 1); setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)
  }

  function handleToggleWishlist(e) {
    e.preventDefault(); e.stopPropagation(); setWishlisted((v) => !v)
  }

  const added = justAdded || isInCart(product.id)
  return (
    <Link to={`/product/${product.id}`} className={`group relative flex min-w-0 flex-col rounded-card border border-pb-gray-border bg-white p-2.5 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-pb-green/25 hover:shadow-panel ${className}`}>
      <div className="relative mb-2.5 aspect-[1.08] overflow-hidden rounded-lg bg-[#f6f8f7]">
        {typeof discountPercent === 'number' && discountPercent > 0 && <span className="absolute left-2 top-2 z-10 rounded-md bg-pb-red px-1.5 py-1 text-[10px] font-extrabold text-white">-{discountPercent}%</span>}
        <button type="button" onClick={handleToggleWishlist} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted} className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-pb-gray-muted shadow-sm hover:text-pb-red">
          <Icon name="heart" size={14} filled={wishlisted} className={wishlisted ? 'text-pb-red' : ''} />
        </button>
        <img src={image} alt={name} loading="lazy" className="h-full w-full object-contain p-3.5 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <p className="line-clamp-1 text-[13px] font-bold text-pb-gray-text">{name}</p>
      {category?.name && <p className="mt-0.5 line-clamp-1 text-[10px] text-pb-gray-muted">{category.name}</p>}
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="text-[14px] font-extrabold text-pb-green-dark">{formatGHS(price)}</span>
        {oldPrice && <span className="text-[10px] text-pb-gray-muted line-through">{formatGHS(oldPrice)}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1"><StarRating value={rating} /><span className="text-[10px] text-pb-gray-muted">({reviewCount})</span></div>
      <button type="button" onClick={handleAddToCart} className={`mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[10px] font-extrabold transition ${added ? 'border-pb-green bg-pb-green text-white' : 'border-pb-green/40 text-pb-green hover:bg-pb-green hover:text-white'}`}>
        <Icon name="cart" size={13} /> {added ? 'Added' : 'Add to Cart'}
      </button>
    </Link>
  )
}
