import Icon from './Icon.jsx'

const POPULAR = [
  ['electronics', 'Electronics', 'headphones'],
  ['phones-tablets', 'Phones', 'phone'],
  ['computing', 'Computing', 'laptop'],
  ['fashion', 'Fashion', 'shirt'],
  ['home-living', 'Home & Living', 'home'],
  ['beauty', 'Beauty', 'beauty'],
  ['sports-outdoors', 'Sports', 'dumbbell'],
  ['automotive', 'Automotive', 'car'],
]

export default function PopularCategories() {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-pb-gray-text">Popular Categories</h2>
        <a href="/categories" className="text-xs font-semibold text-pb-green hover:underline">View all →</a>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-8">
        {POPULAR.map(([id, name, icon]) => (
          <a key={id} href={`/category/${id}`} className="group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition hover:bg-white hover:shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-pb-gray-border bg-white text-pb-green">
              <Icon name={icon} size={15} />
            </span>
            <span className="line-clamp-1 text-center text-[9px] font-semibold text-pb-gray-text">{name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
