import ProductCard from './ProductCard.jsx'
import CountdownTimer from './CountdownTimer.jsx'
import Icon from './Icon.jsx'

// Shared horizontal/grid product listing used by both FlashDeals and
// RecommendedProducts so the two sections stay visually consistent
// without duplicating layout logic.
export default function ProductRail({
  title,
  products,
  viewAllHref = '/products',
  viewAllLabel = 'View all',
  countdownSeconds,
  variant = 'desktop',
  flash = false,
}) {
  const isMobile = variant === 'mobile'
  return (
    <section aria-labelledby={`section-${title}`} className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 id={`section-${title}`} className="flex items-center gap-2 text-[16px] font-extrabold text-pb-gray-text">
            {flash && <Icon name="flash" size={20} className="text-pb-amber" />}
            {title}
          </h2>
          {typeof countdownSeconds === 'number' && (
            <span className="flex items-center gap-2 text-[10px] font-medium text-pb-gray-muted">
              Ends in <CountdownTimer initialSeconds={countdownSeconds} compact={isMobile} />
            </span>
          )}
        </div>
        <a href={viewAllHref} className="shrink-0 text-[11px] font-semibold text-pb-green hover:underline">
          {viewAllLabel} →
        </a>
      </div>

      {isMobile ? (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {products.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}
        </div>
      )}
    </section>
  )
}
