import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import SectionHeading from './SectionHeading.jsx'
import { iconForCategory } from '../../data/categoryIcons.js'

export default function CategoryGrid({ categories }) {
  if (!categories || categories.length === 0) return null

  return (
    <section>
      <SectionHeading title="Shop by Category" viewAllHref="/categories" />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/search?category=${encodeURIComponent(c.id)}`}
            className="flex flex-col items-center gap-2 rounded-card border border-pb-gray-border bg-white px-2 py-4 text-center transition-colors hover:border-pb-green"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={iconForCategory(c.id)} size={20} />
            </span>
            <span className="line-clamp-2 text-xs font-medium text-pb-gray-text">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
