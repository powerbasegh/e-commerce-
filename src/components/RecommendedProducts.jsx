import ProductRail from './ProductRail.jsx'

// "Recommended for you" homepage section — a thin, named wrapper over
// ProductRail per the component list in the customer-frontend spec.
export default function RecommendedProducts({ products, variant = 'desktop' }) {
  return (
    <ProductRail
      title="Recommended for you"
      products={products}
      viewAllHref="/recommended"
      variant={variant}
    />
  )
}
