import Icon from './Icon.jsx'

// Customer-facing fulfillment reassurance card shown on the Product Detail
// page. PowerBase presents as the seller of record to customers — internal
// vendors are fulfillment/accounting-only (see PROJECT_NOTES.md) and are
// never named, rated, or linked to a storefront here.
export default function VendorCard() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="shield" size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-pb-gray-text">Fulfilled by PowerBase</p>
          <span className="flex items-center gap-0.5 rounded-full bg-pb-green-light px-1.5 py-0.5 text-[10px] font-medium text-pb-green-dark">
            <Icon name="checkCircle" size={10} />
            Verified
          </span>
        </div>
        <p className="mt-0.5 text-xs text-pb-gray-muted">
          Every order is packed, shipped and supported directly by PowerBase, with buyer protection included.
        </p>
      </div>
    </div>
  )
}
