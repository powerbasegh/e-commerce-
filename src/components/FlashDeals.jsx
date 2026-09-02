import ProductRail from './ProductRail.jsx'

// Flash Deals homepage section — countdown-driven rail of discounted
// products. A thin, named wrapper over ProductRail per the component list
// in the customer-frontend spec.
export default function FlashDeals({ products, countdownSeconds, variant = 'desktop' }) {
  return (
    <ProductRail
      title="Flash Deals"
      products={products}
      viewAllHref="/flash-deals"
      countdownSeconds={countdownSeconds}
      variant={variant}
      flash
    />
  )
}
