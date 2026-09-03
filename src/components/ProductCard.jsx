import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { formatGHS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'

// Product card used throughout the storefront (Flash Deals, Recommended,
// category grids). Matches the marketplace reference design: discount
// badge, wishlist toggle, name + category subtitle, GH₵ price pair,
// rating + review count, and an Add to Cart action that works straight
// from the grid without leaving the page.
export default function ProductCard({ product, className = '' }) {
  const { name, price, oldPrice, discountPercent, rating, reviewCount, category } = product
  const { addItem, isInCart } = useCart()
  const [wishlisted, setWishlisted] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)
  }

  function handleToggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted((v) => !v)
  }

  const added = justAdded || isInCart(product.id)

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group relative flex w-[136px] shrink-0 flex-col rounded-card border border-pb-gray-border bg-white p-2 transition-shadow hover:shadow-panel sm:w-[146px] ${className}`}
    >

      <p className="line-clamp-1 text-[11px] font-semibold text-pb-gray-text">{name}</p>
      {category?.name && (
        <p className="line-clamp-1 text-[9px] text-pb-gray-muted">{category.name}</p>
      )}

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[12px] font-extrabold text-pb-gray-text">{formatGHS(price)}</span>
        {oldPrice && (
          <span className="text-[9px] text-pb-gray-muted line-through">{formatGHS(oldPrice)}</span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-1">
        <StarRating value={rating} />
        {typeof reviewCount === 'number' && (
          <span className="text-[9px] text-pb-gray-muted">({reviewCount})</span>
        )}
      </div>

      {/* Desktop: full-width labelled button. Mobile: compact icon button
          so cards stay narrow enough for the horizontal scroll rail. */}
      <button
        type="button"
        onClick={handleAddToCart}
        className={`mt-2 hidden w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-bold transition-colors sm:flex ${
          added
            ? 'border-pb-green bg-pb-green text-white'
            : 'border-pb-green text-pb-green hover:bg-pb-green hover:text-white'
        }`}
      >
        <Icon name="cart" size={14} />
        {added ? 'Added' : 'Add to Cart'}
      </button>

      <button
        type="button"
        onClick={handleAddToCart}
        aria-label="Add to cart"
        className="mt-2.5 flex h-7 w-7 items-center justify-center self-end rounded-md bg-pb-green text-white sm:hidden"
      >
        <Icon name="cart" size={14} />
      </button>
    </Link>
  )
}
