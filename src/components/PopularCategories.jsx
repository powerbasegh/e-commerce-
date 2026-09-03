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

export default function PopularCategories() {
  return (
    <section className="min-w-0 rounded-card border border-pb-gray-border bg-white px-4 py-4 sm:px-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pb-green">SHOP BY CATEGORY</p><h2 className="mt-0.5 text-[18px] font-extrabold tracking-[-0.03em] text-pb-gray-text">Popular Categories</h2></div>
        <Link to="/categories" className="shrink-0 text-[11px] font-extrabold text-pb-green">View all <span aria-hidden="true">→</span></Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto sm:grid sm:grid-cols-4 lg:grid-cols-8">
        {POPULAR.map(([id, name, image]) => (
          <Link key={id} to={`/category/${id}`} className="group flex w-[88px] shrink-0 flex-col items-center gap-2 sm:w-auto">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#f5f7f6] p-3 transition group-hover:bg-pb-green-light">
              <img src={image} alt={name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
            </span>
            <span className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-pb-gray-text">{name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
