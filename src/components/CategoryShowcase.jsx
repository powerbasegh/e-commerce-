import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const POPULAR = [
  ['electronics', 'Electronics', 'headphones'],
  ['phones-tablets', 'Phones & Tablets', 'phone'],
  ['computing', 'Computing', 'laptop'],
  ['fashion', 'Fashion', 'shirt'],
  ['home-living', 'Home & Living', 'home'],
  ['beauty', 'Beauty', 'beauty'],
  ['sports-outdoors', 'Sports', 'dumbbell'],
  ['automotive', 'Automotive', 'car'],
]

// Horizontal, image-led category showcase for the homepage — separate
// from the text/icon CategorySidebar so the two don't compete visually.
export default function CategoryShowcase() {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-pb-gray-text">Popular Categories</h2>
        <Link to="/categories" className="text-xs font-semibold text-pb-green hover:underline">View all →</Link>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 xl:grid-cols-8">
        {POPULAR.map(([id, name, icon]) => (
          <Link
            key={id}
            to={`/category/${id}`}
            className="group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition hover:bg-white hover:shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-pb-gray-border bg-white text-pb-green transition group-hover:border-pb-green/30 group-hover:bg-pb-green-light">
              <Icon name={icon} size={18} />
            </span>
            <span className="line-clamp-1 text-center text-[9px] font-semibold text-pb-gray-text">{name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
