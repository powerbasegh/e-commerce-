import Icon from './Icon.jsx'

export default function VendorCard({ vendor }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-sm font-bold text-pb-green-dark">
        {vendor.name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-pb-gray-text">{vendor.name}</p>
          {vendor.verified && (
            <span className="flex items-center gap-0.5 rounded-full bg-pb-green-light px-1.5 py-0.5 text-[10px] font-medium text-pb-green-dark">
              <Icon name="shield" size={10} />
              Verified
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-pb-gray-muted">
          <span className="flex items-center gap-1">
            <Icon name="star" size={12} filled className="text-pb-amber" strokeWidth={0} />
            {vendor.rating.toFixed(1)}
          </span>
          <span>{vendor.location}</span>
          <span>{vendor.productCount} products</span>
        </p>
      </div>

      <a
        href={`/store/${vendor.id}`}
        className="shrink-0 rounded-full border border-pb-green px-3.5 py-1.5 text-xs font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
      >
        Visit Store
      </a>
    </div>
  )
}
