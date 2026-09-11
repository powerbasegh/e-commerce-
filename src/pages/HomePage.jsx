import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import HomeHero from '../components/home/HomeHero.jsx'
import CategoryGrid from '../components/home/CategoryGrid.jsx'
import ProductScrollRow from '../components/home/ProductScrollRow.jsx'
import TrustBenefits from '../components/TrustBenefits.jsx'
import Footer from '../components/Footer.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { api } from '../services/api.js'

// Home no longer reproduces the old sidebar + live-cart-panel layout. It's
// a straightforward hero, category grid, and two product rows pulled from
// the real product API — a "Deals" row (products with a real old_price)
// and a "New Arrivals" row (most recently added). Nothing here is
// invented: if the backend has no discounted or no recent products yet,
// that row just doesn't render (see ProductScrollRow).
export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [deals, setDeals] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)

    Promise.all([
      api.getCategories(),
      api.getProducts({ sort: 'price_asc', limit: 12 }),
      api.getProducts({ sort: 'newest', limit: 12 }),
    ])
      .then(([categoriesData, allProducts, newestData]) => {
        if (cancelled) return
        setCategories(categoriesData.categories || [])
        setDeals((allProducts.products || []).filter((p) => p.discountPercent))
        setNewArrivals(newestData.products || [])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="/" />

      <div className="mx-auto hidden max-w-[1440px] flex-col gap-6 px-6 py-5 lg:flex">
        <HomeHero variant="desktop" />

        {loading ? (
          <SectionSkeleton />
        ) : loadError ? (
          <LoadError />
        ) : (
          <>
            <CategoryGrid categories={categories} />
            <ProductScrollRow title="Deals" products={deals} viewAllHref="/search?sort=price_asc" />
            <ProductScrollRow title="New Arrivals" products={newArrivals} viewAllHref="/search?sort=newest" />
          </>
        )}

        <TrustBenefits variant="desktop" />
      </div>

      <div className="lg:hidden">
        <MobileHeader />

        <main className="flex flex-col gap-5 px-4 pb-24 pt-3">
          <MobileSearch />
          <HomeHero variant="mobile" />

          {loading ? (
            <SectionSkeleton />
          ) : loadError ? (
            <LoadError />
          ) : (
            <>
              <CategoryGrid categories={categories} />
              <ProductScrollRow title="Deals" products={deals} viewAllHref="/search?sort=price_asc" />
              <ProductScrollRow title="New Arrivals" products={newArrivals} viewAllHref="/search?sort=newest" />
            </>
          )}

          <TrustBenefits variant="mobile" />
        </main>

        <BottomNav activeId="home" />
      </div>

      <div className="pb-16 lg:pb-0">
        <Footer />
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-5 w-40 rounded bg-pb-gray-border" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 w-40 shrink-0 rounded-card bg-pb-gray-border" />
        ))}
      </div>
    </div>
  )
}

function LoadError() {
  return (
    <div className="rounded-card border border-pb-gray-border bg-white px-4 py-8 text-center text-sm text-pb-gray-muted">
      We couldn't load products right now. Please refresh the page.
    </div>
  )
}
