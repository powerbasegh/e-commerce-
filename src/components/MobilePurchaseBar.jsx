export default function MobilePurchaseBar({ onAddToCart, onBuyNow }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-pb-gray-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <button
        type="button"
        onClick={onAddToCart}
        className="flex-1 rounded-card border border-pb-green py-2.5 text-sm font-semibold text-pb-green"
      >
        Add to Cart
      </button>

      <button
        type="button"
        onClick={onBuyNow}
        className="flex-1 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white"
      >
        Buy Now
      </button>
    </div>
  )
}
