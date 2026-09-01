import ProductCard from './ProductCard.jsx'
import CountdownTimer from './CountdownTimer.jsx'
import Icon from './Icon.jsx'

export default function ProductSection({ title, products, viewAllHref = '/products', countdownSeconds, variant = 'desktop' }) {
  const isMobile = variant === 'mobile'
  return (
    <section aria-labelledby={`section-${title}`} className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <h2 id={`section-${title}`} className="flex items-center gap-2 text-lg font-extrabold text-pb-gray-text">
            {title === 'Flash Deals' && <Icon name="flash" size={20} className="text-pb-amber" />}
            {title}
          </h2>
          {typeof countdownSeconds === 'number' && <span className="flex items-center gap-1.5 text-[11px] text-pb-gray-muted">Ends in <CountdownTimer initialSeconds={countdownSeconds} /></span>}
        </div>
        <a href={viewAllHref} className="shrink-0 text-xs font-semibold text-pb-green hover:underline">View all →</a>
      </div>

      {isMobile ? (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 2xl:grid-cols-6">{products.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}</div>
      )}
    </section>
  )
}
