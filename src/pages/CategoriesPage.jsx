import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Footer from '../components/Footer.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../services/api.js'
import { iconForCategory } from '../data/categoryIcons.js'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data.categories || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="/categories" />
      <div className="lg:hidden">
        <MobileHeader />
      </div>

      <main className="mx-auto max-w-[1000px] px-4 py-6 lg:px-6">
        <h1 className="mb-4 text-lg font-bold text-pb-gray-text">All Categories</h1>

        {loading ? (
          <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-card bg-pb-gray-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/search?category=${encodeURIComponent(c.id)}`}
                className="flex flex-col items-center gap-2 rounded-card border border-pb-gray-border bg-white px-3 py-6 text-center transition-colors hover:border-pb-green"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
                  <Icon name={iconForCategory(c.id)} size={22} />
                </span>
                <span className="text-sm font-medium text-pb-gray-text">{c.name}</span>
                <span className="text-xs text-pb-gray-muted">{c.productCount} products</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <div className="pb-16 lg:pb-0">
        <Footer />
      </div>
      <div className="lg:hidden">
        <BottomNav activeId="categories" />
      </div>
    </div>
  )
}
