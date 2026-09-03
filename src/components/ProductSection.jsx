import ProductCard from './ProductCard.jsx'
import { Link } from 'react-router-dom'
import CountdownTimer from './CountdownTimer.jsx'

export default function ProductSection({
  title,
  products,
  viewAllHref = '/products',
  countdownSeconds,
  variant = 'desktop',
}) {
  const isMobile = variant === 'mobile'

  return (
    <section aria-labelledby={`section-${title}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 id={`section-${title}`} className="text-base font-bold text-pb-gray-text sm:text-lg">
            {title}
          </h2>
          {typeof countdownSeconds === 'number' && (
            <span className="flex items-center gap-1.5 text-xs text-pb-gray-muted">
              Ends in:
              <CountdownTimer initialSeconds={countdownSeconds} />
            </span>
          )}
        </div>
        <Link to={viewAllHref} className="text-sm font-extrabold text-pb-green hover:text-pb-green-dark">
          View all
        </Link>
      </div>

      {isMobile ? (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} className="w-full" />
          ))}
        </div>
      )}
    </section>
  )
}
