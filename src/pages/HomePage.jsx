import { useEffect, useState } from 'react'
import TopUtilityBar from '../components/TopUtilityBar.jsx'
import Header from '../components/Header.jsx'
import CategorySidebar from '../components/CategorySidebar.jsx'
import HeroSection from '../components/HeroSection.jsx'
import SavingsCard from '../components/SavingsCard.jsx'
import FlashDeals from '../components/FlashDeals.jsx'
import RecommendedProducts from '../components/RecommendedProducts.jsx'
import PopularCategories from '../components/PopularCategories.jsx'
import TrustSection from '../components/TrustSection.jsx'
import Footer from '../components/Footer.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import MobileCategoryRow from '../components/MobileCategoryRow.jsx'
import TrustBenefits from '../components/TrustBenefits.jsx'
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

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                     */}
      {/* ------------------------------------------------------------------ */}
      <TopUtilityBar />
      <Header activePath="/" />

      <div className="mx-auto hidden max-w-[1480px] flex-col gap-5 px-5 py-5 xl:px-6 lg:flex">
        <div className="flex items-start gap-4">
          <CategorySidebar />
          <div className="flex min-w-0 flex-1 items-stretch gap-6">
            <HeroSection variant="desktop" />
            <SavingsCard />
          </div>
        </div>

        {loading ? (
          <SectionSkeleton />
        ) : (
          <>
            <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="desktop" />
            <div className="grid min-w-0 grid-cols-[minmax(0,1.3fr)_minmax(0,0.95fr)] items-start gap-5">
              <PopularCategories />
              <RecommendedProducts products={recommended} variant="desktop" />
            </div>
          </>
        )}

        <TrustSection variant="desktop" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout: Header + Search + Hero + Categories + Sections +    */}
      {/* Promotions + Trust + Fixed bottom nav. Not a shrunk desktop copy.  */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader />

        <main className="flex flex-col gap-5 px-4 pb-24 pt-3">
          <MobileSearch />
          <HeroSection variant="mobile" />
          <TrustBenefits variant="mobile" />
          <MobileCategoryRow />

          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="mobile" />
              <PopularCategories />
              <RecommendedProducts products={recommended} variant="mobile" />
            </>
          )}
        </main>

        <BottomNav activeId="home" />
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-4 w-36 rounded bg-pb-gray-border" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 w-36 shrink-0 rounded-card bg-pb-gray-border" />
        ))}
      </div>
    </div>
  )
}
