import { Link } from 'react-router-dom'

const POPULAR = [
  ['electronics', 'Electronics', '/products/earbuds.svg'],
  ['phones-tablets', 'Phones & Tablets', '/products/smartwatch.svg'],
  ['computing', 'Computing', '/products/tv.svg'],
  ['fashion', 'Fashion', '/products/sneakers.svg'],
  ['home-living', 'Home & Living', '/products/airfryer.svg'],
  ['beauty', 'Beauty', '/products/handbag.svg'],
  ['sports-outdoors', 'Sports', '/products/speaker.svg'],
  ['automotive', 'Automotive', '/products/backpack.svg'],
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
        {POPULAR.map(([id, name, image]) => (
          <Link
            key={id}
            to={`/category/${id}`}
            className="group flex flex-col items-center gap-2.5 rounded-xl p-3 transition hover:bg-white hover:shadow-card"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-pb-gray-border bg-pb-gray-bg p-3 transition group-hover:border-pb-green/30 group-hover:bg-pb-green-light">
              <img src={image} alt={name} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
            </span>
            <span className="line-clamp-1 text-center text-[11px] font-semibold text-pb-gray-text">{name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
