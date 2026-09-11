import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import MobileSearch from '../components/MobileSearch.jsx'
import Footer from '../components/Footer.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../services/api.js'
import { iconForCategory } from '../data/categoryIcons.js'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Number(searchParams.get('page') || 1)

  const [categories, setCategories] = useState([])
  const [result, setResult] = useState({ products: [], pagination: { page: 1, totalPages: 1, total: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getProducts({ q, category, sort, page, limit: 24 })
      .then((data) => {
        if (cancelled) return
        setResult(data)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ products: [], pagination: { page: 1, totalPages: 1, total: 0 } })
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [q, category, sort, page])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0 })
  }

  const activeCategory = categories.find((c) => c.id === category)
  const heading = q ? `Results for "${q}"` : activeCategory ? activeCategory.name : 'All Products'

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header activePath="/search" />

      <div className="mx-auto hidden max-w-[1440px] gap-5 px-6 py-5 lg:flex">
        <FilterSidebar
          categories={categories}
          activeCategory={category}
          sort={sort}
          onSelectCategory={(id) => updateParam('category', id)}
          onSelectSort={(value) => updateParam('sort', value)}
        />

        <main className="min-w-0 flex-1">
          <ResultsHeader heading={heading} total={result.pagination?.total} loading={loading} />
          <ResultsGrid loading={loading} products={result.products} />
          <PaginationBar pagination={result.pagination} onPageChange={goToPage} />
        </main>
      </div>

      <div className="lg:hidden">
        <MobileHeader />
        <main className="flex flex-col gap-4 px-4 pb-24 pt-3">
          <MobileSearch />

          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <SortSelect sort={sort} onChange={(value) => updateParam('sort', value)} />
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="shrink-0 rounded-sm border border-pb-gray-border bg-white px-3 py-2 text-xs text-pb-gray-text"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <ResultsHeader heading={heading} total={result.pagination?.total} loading={loading} />
          <ResultsGrid loading={loading} products={result.products} />
          <PaginationBar pagination={result.pagination} onPageChange={goToPage} />
        </main>
        <BottomNav activeId="categories" />
      </div>

      <div className="pb-16 lg:pb-0">
        <Footer />
      </div>
    </div>
  )
}

function FilterSidebar({ categories, activeCategory, sort, onSelectCategory, onSelectSort }) {
  return (
    <aside className="w-56 shrink-0">
      <div className="rounded-card border border-pb-gray-border bg-white p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-pb-gray-muted">
          <Icon name="filter" size={13} />
          Category
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                !activeCategory ? 'bg-pb-green-light font-semibold text-pb-green-dark' : 'text-pb-gray-text hover:bg-pb-gray-bg'
              }`}
            >
              All Categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelectCategory(c.id)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                  activeCategory === c.id ? 'bg-pb-green-light font-semibold text-pb-green-dark' : 'text-pb-gray-text hover:bg-pb-gray-bg'
                }`}
              >
                <Icon name={iconForCategory(c.id)} size={15} />
                <span className="truncate">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-card border border-pb-gray-border bg-white p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pb-gray-muted">Sort By</p>
        <select
          value={sort}
          onChange={(e) => onSelectSort(e.target.value)}
          className="w-full rounded-sm border border-pb-gray-border bg-white px-2 py-2 text-sm text-pb-gray-text"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  )
}

function SortSelect({ sort, onChange }) {
  return (
    <select
      value={sort}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-sm border border-pb-gray-border bg-white px-3 py-2 text-xs text-pb-gray-text"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function ResultsHeader({ heading, total, loading }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h1 className="text-base font-bold text-pb-gray-text sm:text-lg">{heading}</h1>
      {!loading && <span className="text-xs text-pb-gray-muted">{total} {total === 1 ? 'product' : 'products'}</span>}
    </div>
  )
}

function ResultsGrid({ loading, products }) {
  if (loading) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-card bg-pb-gray-border" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-pb-gray-border bg-white px-4 py-16 text-center">
        <Icon name="search" size={28} className="text-pb-gray-muted" />
        <p className="text-sm font-semibold text-pb-gray-text">No products found</p>
        <p className="text-xs text-pb-gray-muted">Try a different search term or category.</p>
        <Link to="/" className="mt-2 text-xs font-semibold text-pb-green">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} className="!w-full" />
      ))}
    </div>
  )
}

function PaginationBar({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null
  const { page, totalPages } = pagination

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-sm border border-pb-gray-border text-pb-gray-text disabled:opacity-40"
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <span className="text-sm text-pb-gray-text">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-sm border border-pb-gray-border text-pb-gray-text disabled:opacity-40"
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  )
}
