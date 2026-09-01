import Icon from './Icon.jsx'

const POPULAR = [
  ['electronics', 'Electronics', '/products/earbuds.svg'],
  ['phones-tablets', 'Phones', '/products/smartwatch.svg'],
  ['computing', 'Computing', '/products/tv.svg'],
  ['fashion', 'Fashion', '/products/sneakers.svg'],
  ['home-living', 'Home & Living', '/products/airfryer.svg'],
  ['beauty', 'Beauty', '/products/handbag.svg'],
  ['sports-outdoors', 'Sports', '/products/speaker.svg'],
  ['automotive', 'Automotive', '/products/backpack.svg'],
]

export default function PopularCategories() {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-pb-gray-text">Popular Categories</h2>
        <a href="/categories" className="text-xs font-semibold text-pb-green hover:underline">View all →</a>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {POPULAR.map(([id, name, image]) => (
          <a key={id} href={`/category/${id}`} className="group flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-pb-gray-border bg-white p-2 shadow-card transition hover:-translate-y-0.5 hover:border-pb-green/30 hover:shadow-panel">
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-pb-gray-bg p-1.5"><img src={image} alt={name} className="h-full w-full object-contain transition-transform group-hover:scale-105" /></span>
            <span className="mt-1 line-clamp-1 text-center text-[10px] font-semibold text-pb-gray-text">{name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
