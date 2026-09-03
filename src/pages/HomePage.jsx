import { useEffect, useState } from 'react'
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
import BottomNav from '../components/BottomNav.jsx'
import MobileCategoryRow from '../components/MobileCategoryRow.jsx'
import { getFlashDeals, getRecommendedProducts, flashDealsEndsInSeconds } from '../data/mockData.js'

export default function HomePage() {
  const [flashDeals, setFlashDeals] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getFlashDeals(), getRecommendedProducts()]).then(([deals, products]) => {
      if (!cancelled) {
        setFlashDeals(deals)
        setRecommended(products)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <div className="hidden lg:block">
        <Header activePath="/" />
        <main className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 xl:px-6">
          <section className="grid grid-cols-[216px_minmax(0,1fr)_220px] items-stretch gap-4" aria-label="Featured shopping area">
            <CategorySidebar />
            <HeroSection variant="desktop" />
            <SavingsCard />
          </section>

          {loading ? (
            <SectionSkeleton />
          ) : (
            <>
              <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="desktop" />
              <PopularCategories />
              <RecommendedProducts products={recommended} variant="desktop" />
              <TrustSection />
            </>
          )}
        </main>
        <Footer />
      </div>

      <div className="lg:hidden">
        <MobileHeader />
        <main className="flex flex-col gap-5 px-3 pb-24 pt-3 sm:px-4">
          <HeroSection variant="mobile" />
          <MobileCategoryRow />
          {loading ? (
            <SectionSkeleton mobile />
          ) : (
            <>
              <FlashDeals products={flashDeals} countdownSeconds={flashDealsEndsInSeconds} variant="mobile" />
              <PopularCategories />
              <RecommendedProducts products={recommended} variant="mobile" />
              <TrustSection />
            </>
          )}
        </main>
        <BottomNav activeId="home" />
      </div>
    </div>
  )
}

function SectionSkeleton({ mobile = false }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-5 w-40 rounded bg-pb-gray-border" />
      <div className={`grid gap-3 ${mobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        {Array.from({ length: mobile ? 4 : 6 }).map((_, index) => (
          <div key={index} className="h-60 rounded-card bg-pb-gray-border" />
        ))}
      </div>
    </div>
  )
}
