import ProductCard from '../ProductCard.jsx'
import SectionHeading from './SectionHeading.jsx'

// Horizontal scrolling row of products, used for Home page sections.
// Renders nothing if there are no products, rather than showing an empty
// shell — a category or deal list with zero real items just isn't shown.
export default function ProductScrollRow({ title, products, viewAllHref }) {
  if (!products || products.length === 0) return null

  return (
    <section>
      <SectionHeading title={title} viewAllHref={viewAllHref} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
