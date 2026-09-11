import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ImageGallery from '../components/ImageGallery.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import DeliveryInfo from '../components/DeliveryInfo.jsx'
import BuyerProtectionSection from '../components/BuyerProtectionSection.jsx'
import ProductInfoTabs from '../components/ProductInfoTabs.jsx'
import ProductScrollRow from '../components/home/ProductScrollRow.jsx'
import Footer from '../components/Footer.jsx'
import MobilePurchaseBar from '../components/MobilePurchaseBar.jsx'
import Toast from '../components/Toast.jsx'
import { formatGHS } from '../data/mockData.js'
import { api } from '../services/api.js'
import { useCart } from '../context/CartContext.jsx'

// Product details are read straight from the real product API — no rating,
// review count, or vendor information is shown because the backend doesn't
// provide any of that (see server/src/controllers/productController.js).
export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setQuantity(1)

    api
      .getProduct(productId)
      .then(async (data) => {
        if (cancelled) return
        const found = data.product
        setProduct(found)
        if (found.category?.id) {
          try {
            const relatedData = await api.getProducts({ category: found.category.id, limit: 8 })
            if (!cancelled) setRelated((relatedData.products || []).filter((p) => p.id !== found.id))
          } catch {
            if (!cancelled) setRelated([])
          }
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
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

  function handleAddToCart() {
    addItem(product, quantity)
    showToast(`Added ${quantity} × ${product.name} to cart`)
  }

  function handleBuyNow() {
    addItem(product, quantity)
    navigate('/cart')
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-pb-gray-bg">
        <Header />
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-lg font-semibold text-pb-gray-text">Product not found</p>
          <p className="text-sm text-pb-gray-muted">This product may have been removed or the link is incorrect.</p>
          <Link to="/" className="mt-2 rounded-card bg-pb-green px-5 py-2 text-sm font-semibold text-white">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const breadcrumbItems = product
    ? [
        { label: 'Home', href: '/' },
        ...(product.category ? [{ label: product.category.name, href: `/search?category=${product.category.id}` }] : []),
        { label: product.name },
      ]
    : []

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-6 px-6 py-6 lg:flex">
        {loading || !product ? (
          <DesktopSkeleton />
        ) : (
          <>
            <Breadcrumbs items={breadcrumbItems} />

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8">
              <ImageGallery images={[product.image]} productName={product.name} discountPercent={product.discountPercent} />

              <ProductPurchasePanel
                product={product}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8">
              <ProductInfoTabs description={product.description} specs={product.specs || []} />
              <div className="flex flex-col gap-5">
                <DeliveryInfo />
                <BuyerProtectionSection />
              </div>
            </div>

            <ProductScrollRow title="Related Products" products={related} viewAllHref={product.category ? `/search?category=${product.category.id}` : '/search'} />
          </>
        )}
      </div>

      <div className="lg:hidden">
        <MobileHeader />

        <main className="flex flex-col gap-5 px-4 pb-28 pt-3">
          <MobileSearch />

          {loading || !product ? (
            <MobileSkeleton />
          ) : (
            <>
              <Breadcrumbs items={breadcrumbItems} />
              <ImageGallery images={[product.image]} productName={product.name} discountPercent={product.discountPercent} />
              <ProductSummary product={product} />

              <div className="flex items-center justify-between rounded-card border border-pb-gray-border bg-white p-3">
                <span className="text-sm font-medium text-pb-gray-text">Quantity</span>
                <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
              </div>

              <DeliveryInfo />
              <BuyerProtectionSection />
              <ProductInfoTabs description={product.description} specs={product.specs || []} />

              <ProductScrollRow title="Related Products" products={related} viewAllHref={product.category ? `/search?category=${product.category.id}` : '/search'} />
            </>
          )}
        </main>

        {!loading && product && <MobilePurchaseBar onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />}
      </div>

      <div className="pb-24 lg:pb-0">
        <Footer />
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  )
}

function ProductSummary({ product }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-lg font-bold leading-snug text-pb-gray-text">{product.name}</h1>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-pb-gray-text">{formatGHS(product.price)}</span>
        {product.oldPrice && <span className="text-sm text-pb-gray-muted line-through">{formatGHS(product.oldPrice)}</span>}
        {product.discountPercent > 0 && (
          <span className="rounded-sm bg-pb-red/10 px-1.5 py-0.5 text-xs font-semibold text-pb-red">-{product.discountPercent}%</span>
        )}
      </div>
      <p className={`text-xs font-medium ${product.stock > 0 ? 'text-pb-green' : 'text-pb-red'}`}>
        {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
      </p>
    </div>
  )
}

function ProductPurchasePanel({ product, quantity, setQuantity, onAddToCart, onBuyNow }) {
  const outOfStock = !(product.stock > 0)
  return (
    <div className="flex flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-5">
      <ProductSummary product={product} />

      <div className="flex items-center gap-3 border-t border-pb-gray-border pt-4">
        <span className="text-sm font-medium text-pb-gray-text">Quantity</span>
        <QuantitySelector quantity={quantity} onChange={setQuantity} max={Math.max(product.stock, 1)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={outOfStock}
          className="flex-1 rounded-card border border-pb-green py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          disabled={outOfStock}
          className="flex-1 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy Now
        </button>
      </div>
    </div>
  )
}

function DesktopSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8" aria-hidden="true">
      <div className="aspect-square rounded-card bg-pb-gray-border" />
      <div className="flex flex-col gap-3 rounded-card bg-white p-5">
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
