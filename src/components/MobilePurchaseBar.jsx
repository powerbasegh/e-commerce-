import Icon from './Icon.jsx'

export default function MobilePurchaseBar({ isWishlisted, onToggleWishlist, onAddToCart, onBuyNow }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-pb-gray-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <button
        type="button"
        onClick={onToggleWishlist}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isWishlisted}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          isWishlisted ? 'border-pb-red bg-red-50 text-pb-red' : 'border-pb-gray-border text-pb-gray-text'
        }`}
      >
        <Icon name="heart" size={19} filled={isWishlisted} />
      </button>

      <button
        type="button"
        onClick={onAddToCart}
        className="flex-1 rounded-full border border-pb-green py-2.5 text-sm font-semibold text-pb-green"
      >
        Add to Cart
      </button>

      <button
        type="button"
        onClick={onBuyNow}
        className="flex-1 rounded-full bg-pb-green py-2.5 text-sm font-semibold text-white"
      >
        Buy Now
      </button>
    </div>
  )
}
