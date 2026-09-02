import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ImageGallery from '../components/ImageGallery.jsx'
import StarRating from '../components/StarRating.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import DeliveryInfo from '../components/DeliveryInfo.jsx'
import BuyerProtectionSection from '../components/BuyerProtectionSection.jsx'
import ProductInfoTabs from '../components/ProductInfoTabs.jsx'
import VendorCard from '../components/VendorCard.jsx'
import ReviewsSection from '../components/ReviewsSection.jsx'
import ProductRail from '../components/ProductRail.jsx'
import MobilePurchaseBar from '../components/MobilePurchaseBar.jsx'
import Icon from '../components/Icon.jsx'
import Toast from '../components/Toast.jsx'
import { getProductById, getRelatedProducts, getReviews, formatGHS, categories } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setQuantity(1)
    setIsWishlisted(false)

    getProductById(productId).then(async (found) => {
      if (cancelled) return
      if (!found) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const [relatedProducts, reviewData] = await Promise.all([
        getRelatedProducts(found),
        Promise.resolve(getReviews(found.id)),
      ])
      if (cancelled) return
      setProduct(found)
      setRelated(relatedProducts)
      setReviews(reviewData)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [productId])

  function showToast(message) {
    setToastMessage(message)
    setToastVisible(true)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToastVisible(false), 1800)
  }

  // Add to Cart adds the selected product/quantity to the real global cart
  // (see src/context/CartContext.jsx). If it's already in the cart, the
  // context merges quantities and clamps to available stock — this page
  // doesn't duplicate that logic.
  function handleAddToCart() {
    addItem(product, quantity)
    showToast(`Added ${quantity} × ${product.name} to cart`)
  }

  // Buy Now adds the item (if not already there) and takes the customer
  // straight to the Cart Page. A dedicated Checkout flow is a later phase,
  // so the Cart Page is the furthest this can go for now.
  function handleBuyNow() {
    addItem(product, quantity)
    navigate('/cart')
  }

  function handleToggleWishlist() {
    setIsWishlisted((v) => {
      const next = !v
      showToast(next ? 'Added to wishlist' : 'Removed from wishlist')
      return next
    })
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-pb-gray-bg">
        <Header notificationCount={0} />
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-lg font-semibold text-pb-gray-text">Product not found</p>
          <p className="text-sm text-pb-gray-muted">This product may have been removed or the link is incorrect.</p>
          <Link to="/" className="mt-2 rounded-full bg-pb-green px-5 py-2 text-sm font-semibold text-white">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const categoryMeta = product ? categories.find((c) => c.id === product.category.id) : null
  const breadcrumbItems = product
    ? [
        { label: 'Home', href: '/' },
        { label: categoryMeta?.name ?? product.category.name, href: `/category/${product.category.id}` },
        { label: product.name },
      ]
    : []

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={3} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-6 px-6 py-6 lg:flex">
        {loading || !product ? (
          <DesktopSkeleton />
        ) : (
          <>
            <Breadcrumbs items={breadcrumbItems} />

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8">
              <ImageGallery
                images={product.gallery}
                productName={product.name}
                discountPercent={product.discountPercent}
              />

              <ProductPurchasePanel
                product={product}
                quantity={quantity}
                setQuantity={setQuantity}
                isWishlisted={isWishlisted}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8">
              <div className="flex flex-col gap-5">
                <ProductInfoTabs description={product.description} specs={product.specs} />
                <ReviewsSection {...reviews} />
              </div>
              <div className="flex flex-col gap-5">
                <DeliveryInfo location={product.vendor.location} />
                <BuyerProtectionSection />
                <VendorCard vendor={product.vendor} />
              </div>
            </div>

            <ProductRail
              title="Related Products"
              products={related}
              viewAllHref={`/category/${product.category.id}`}
              variant="desktop"
            />
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — its own structure, not a shrunk desktop copy       */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />

        <main className="flex flex-col gap-5 px-4 pb-28 pt-3">
          <MobileSearch />

          {loading || !product ? (
            <MobileSkeleton />
          ) : (
            <>
              <Breadcrumbs items={breadcrumbItems} />

              <ImageGallery
                images={product.gallery}
                productName={product.name}
                discountPercent={product.discountPercent}
              />

              <ProductSummary product={product} />

              <div className="flex items-center justify-between rounded-card border border-pb-gray-border bg-white p-3 shadow-card">
                <span className="text-sm font-medium text-pb-gray-text">Quantity</span>
                <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
              </div>

              <DeliveryInfo location={product.vendor.location} />
              <BuyerProtectionSection />
              <ProductInfoTabs description={product.description} specs={product.specs} />
              <VendorCard vendor={product.vendor} />
              <ReviewsSection {...reviews} />

              <ProductRail
                title="Related Products"
                products={related}
                viewAllHref={`/category/${product.category.id}`}
                variant="mobile"
              />
            </>
          )}
        </main>

        {!loading && product && (
          <MobilePurchaseBar
            isWishlisted={isWishlisted}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  )
}

function ProductSummary({ product }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-lg font-bold leading-snug text-pb-gray-text">{product.name}</h1>
      <p className="text-xs text-pb-gray-muted">
        Sold by <span className="font-medium text-pb-gray-text">{product.vendor.name}</span>
      </p>
      <div className="flex items-center gap-2">
        <StarRating value={product.rating} />
        <span className="text-xs text-pb-gray-muted">({product.reviewCount} reviews)</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-pb-gray-text">{formatGHS(product.price)}</span>
        {product.oldPrice && (
          <span className="text-sm text-pb-gray-muted line-through">{formatGHS(product.oldPrice)}</span>
        )}
        {product.discountPercent > 0 && (
          <span className="rounded-md bg-pb-red/10 px-1.5 py-0.5 text-xs font-semibold text-pb-red">
            -{product.discountPercent}%
          </span>
        )}
      </div>
      <p className={`text-xs font-medium ${product.stock > 0 ? 'text-pb-green' : 'text-pb-red'}`}>
        {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
      </p>
    </div>
  )
}

function ProductPurchasePanel({
  product,
  quantity,
  setQuantity,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
      <ProductSummary product={product} />

      <div className="flex items-center gap-3 border-t border-pb-gray-border pt-4">
        <span className="text-sm font-medium text-pb-gray-text">Quantity</span>
        <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          className="flex-1 rounded-card border border-pb-green py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          className="flex-1 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Buy Now
        </button>
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
            isWishlisted ? 'border-pb-red bg-red-50 text-pb-red' : 'border-pb-gray-border text-pb-gray-text hover:border-pb-red hover:text-pb-red'
          }`}
        >
          <Icon name="heart" size={18} filled={isWishlisted} />
        </button>
      </div>
    </div>
  )
}

function DesktopSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8" aria-hidden="true">
      <div className="aspect-square rounded-card bg-pb-gray-border" />
      <div className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-card">
        <div className="h-5 w-2/3 rounded bg-pb-gray-border" />
        <div className="h-4 w-1/3 rounded bg-pb-gray-border" />
        <div className="h-7 w-1/2 rounded bg-pb-gray-border" />
        <div className="mt-4 h-11 rounded-card bg-pb-gray-border" />
      </div>
    </div>
  )
}

function MobileSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
      <div className="aspect-square rounded-card bg-pb-gray-border" />
      <div className="h-5 w-2/3 rounded bg-pb-gray-border" />
      <div className="h-4 w-1/3 rounded bg-pb-gray-border" />
      <div className="h-7 w-1/2 rounded bg-pb-gray-border" />
    </div>
  )
}
