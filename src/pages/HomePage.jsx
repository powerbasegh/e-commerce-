import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Hero from '../components/Hero.jsx'
import ProductSection from '../components/ProductSection.jsx'
import PromoCards from '../components/PromoCards.jsx'
import TrustSection from '../components/TrustSection.jsx'
import CartPanel from '../components/CartPanel.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import MobileCategoryRow from '../components/MobileCategoryRow.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { getFlashDeals, getRecommendedProducts, flashDealsEndsInSeconds } from '../data/mockData.js'

export default function HomePage() {
  const [flashDeals, setFlashDeals] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([getFlashDeals(), getRecommendedProducts()]).then(([deals, recs]) => {
      if (cancelled) return
      setFlashDeals(deals)
      setRecommended(recs)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const notificationCount = 3

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout: Sidebar + Main content + Cart panel                */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={notificationCount} activePath="/" />

      <div className="mx-auto hidden max-w-[1400px] gap-6 px-6 py-6 lg:flex">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <Hero variant="desktop" />

          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <ProductSection
                title="Flash Deals"
                products={flashDeals}
                viewAllHref="/flash-deals"
                countdownSeconds={flashDealsEndsInSeconds}
                variant="desktop"
              />
              <ProductSection
                title="Recommended for you"
                products={recommended}
                viewAllHref="/recommended"
                variant="desktop"
              />
            </>
          )}

          <PromoCards variant="desktop" />
          <TrustSection variant="desktop" />
        </main>

        <CartPanel />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout: Header + Search + Hero + Categories + Sections +    */}
      {/* Promotions + Trust + Fixed bottom nav. Not a shrunk desktop copy.  */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={notificationCount} />

        <main className="flex flex-col gap-5 px-4 pb-24 pt-3">
          <MobileSearch />
          <Hero variant="mobile" />
          <MobileCategoryRow />

          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <ProductSection
                title="Flash Deals"
                products={flashDeals}
                viewAllHref="/flash-deals"
                countdownSeconds={flashDealsEndsInSeconds}
                variant="mobile"
              />
              <ProductSection
                title="Recommended for you"
                products={recommended}
                viewAllHref="/recommended"
                variant="mobile"
              />
            </>
          )}

          <PromoCards variant="mobile" />
          <TrustSection variant="mobile" />
        </main>

        <BottomNav activeId="home" />
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
