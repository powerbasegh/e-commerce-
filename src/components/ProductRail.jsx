import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import CountdownTimer from './CountdownTimer.jsx'
import Icon from './Icon.jsx'

export default function ProductRail({ title, products, viewAllHref = '/products', viewAllLabel = 'View all', countdownSeconds, variant = 'desktop', flash = false }) {
  const isMobile = variant === 'mobile'
  return (
    <section aria-labelledby={`section-${title}`} className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h2 id={`section-${title}`} className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.02em] text-pb-gray-text">
            {flash && <Icon name="flash" size={18} className="text-pb-amber" />}{title}
          </h2>
          {typeof countdownSeconds === 'number' && <span className="hidden items-center gap-2 text-[10px] text-pb-gray-muted sm:flex">Ends in <CountdownTimer initialSeconds={countdownSeconds} compact={isMobile} /></span>}
        </div>
        <Link to={viewAllHref} className="shrink-0 text-[11px] font-extrabold text-pb-green hover:text-pb-green-dark">{viewAllLabel} <span aria-hidden="true">→</span></Link>
      </div>
      {isMobile ? (
        <div className="no-scrollbar -mx-3.5 flex gap-3 overflow-x-auto px-3.5 pb-1 snap-x snap-mandatory sm:-mx-4 sm:px-4">{products.map((p) => <ProductCard key={p.id} product={p} className="w-[166px] snap-start sm:w-[180px]" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{products.map((p) => <ProductCard key={p.id} product={p} className="w-full" />)}</div>
      )}
    </section>
  )
}
