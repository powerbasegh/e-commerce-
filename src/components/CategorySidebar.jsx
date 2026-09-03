import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'

// Desktop "All Categories" marketplace sidebar — sits to the left of the
// hero banner only (not the full page height), matching the reference
// layout. Mobile uses MobileCategoryRow instead.
export default function CategorySidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 lg:block" aria-label="Category navigation">
      <nav className="overflow-hidden rounded-xl border border-pb-gray-border bg-white shadow-card">
        <div className="flex h-11 items-center gap-2 bg-pb-green px-3.5 text-[12px] font-semibold text-white">
          <Icon name="grid" size={14} />
          <span>All Categories</span>
        </div>
        {categories
          .filter((c) => c.id !== 'more')
          .map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="group flex items-center gap-3 border-b border-pb-gray-border/60 px-3.5 py-[8px] text-[12px] text-pb-gray-text last:border-b-0 transition-colors hover:bg-pb-green-light hover:font-semibold hover:text-pb-green-dark"
            >
              <Icon name={category.icon} size={14} className="shrink-0 text-pb-gray-muted group-hover:text-pb-green" />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <Icon name="chevronRight" size={12} className="shrink-0 text-pb-gray-border group-hover:text-pb-green" />
            </Link>
          ))}
        <Link
          to="/categories"
          className="flex items-center gap-2 border-t border-pb-gray-border bg-pb-gray-bg px-3.5 py-2.5 text-[12px] font-semibold text-pb-green hover:bg-pb-green-light"
        >
          <Icon name="grid" size={14} /> View all categories
        </Link>
      </nav>
    </aside>
  )
}
