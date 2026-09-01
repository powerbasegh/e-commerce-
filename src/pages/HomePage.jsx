import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Hero from '../components/Hero.jsx'
import ProductSection from '../components/ProductSection.jsx'
import PromoCards from '../components/PromoCards.jsx'
import TrustSection from '../components/TrustSection.jsx'
import HomePromoPanel from '../components/HomePromoPanel.jsx'
import PopularCategories from '../components/PopularCategories.jsx'
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
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="/" />

      <div className="mx-auto hidden max-w-[1480px] grid-cols-[220px_minmax(0,1fr)] gap-5 px-5 py-5 xl:grid xl:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_275px]">
        <Sidebar />

        <main className="col-start-2 min-w-0">
          <div className="flex flex-col gap-5">
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
                <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-5">
                  <PopularCategories />
                  <ProductSection
                    title="Recommended for you"
                    products={recommended}
                    viewAllHref="/recommended"
                    variant="desktop"
                  />
                </div>
              </>
            )}

            <PromoCards variant="desktop" />
            <TrustSection variant="desktop" />
          </div>
        </main>

        <div className="col-start-3 row-start-1">
          <HomePromoPanel />
        </div>
      </div>

      <div className="xl:hidden">
        <MobileHeader />
        <main className="flex flex-col gap-5 px-4 pb-24 pt-3">
          <MobileSearch />
          <Hero variant="mobile" />
          <MobileCategoryRow />
          {loading ? <SectionSkeleton /> : (
            <>
              <ProductSection title="Flash Deals" products={flashDeals} viewAllHref="/flash-deals"
                countdownSeconds={flashDealsEndsInSeconds} variant="mobile" />
              <PopularCategories />
              <ProductSection title="Recommended for you" products={recommended} viewAllHref="/recommended" variant="mobile" />
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
          <div key={i} className="h-52 flex-1 rounded-card bg-pb-gray-border" />
        ))}
      </div>
    </div>
  )
}
