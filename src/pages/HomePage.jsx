import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import CategorySidebar from '../components/CategorySidebar.jsx'
import HeroSection from '../components/HeroSection.jsx'
import PromoCard from '../components/PromoCard.jsx'
import FlashDeals from '../components/FlashDeals.jsx'
import RecommendedProducts from '../components/RecommendedProducts.jsx'
import PromoCards from '../components/PromoCards.jsx'
import TrustBenefits from '../components/TrustBenefits.jsx'
import CategoryShowcase from '../components/CategoryShowcase.jsx'
import Footer from '../components/Footer.jsx'
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

      {/* Desktop layout: CategorySidebar | main content, max-width container
          centered for 1366 / 1440 / 1536px screens. */}
      <div className="mx-auto hidden max-w-[1480px] gap-5 px-5 py-5 xl:flex">
        <CategorySidebar />

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex gap-5">
            <div className="min-w-0 flex-1">
              <HeroSection variant="desktop" />
            </div>
            <PromoCard />
          </div>

          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="desktop" />
              <CategoryShowcase />
              <RecommendedProducts products={recommended} variant="desktop" />
            </>
          )}

          <PromoCards variant="desktop" />
          <TrustBenefits variant="desktop" />
        </main>
      </div>

      {/* Mobile / tablet layout */}
      <div className="xl:hidden">
        <MobileHeader />
        <main className="flex flex-col gap-5 px-4 pb-24 pt-3">
          <MobileSearch />
          <HeroSection variant="mobile" />
          <MobileCategoryRow />
          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="mobile" />
              <CategoryShowcase />
              <RecommendedProducts products={recommended} variant="mobile" />
            </>
          )}
          <PromoCards variant="mobile" />
          <TrustBenefits variant="mobile" />
        </main>
        <BottomNav activeId="home" />
      </div>

      <div className="hidden xl:block">
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
          <div key={i} className="h-52 flex-1 rounded-card bg-pb-gray-border" />
        ))}
      </div>
    </div>
  )
}
