import Icon from '../Icon.jsx'

export default function AccountSummaryCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <p className="text-xl font-bold text-pb-gray-text">{value}</p>
        <p className="text-xs text-pb-gray-muted">{label}</p>
      </div>
    </div>
  )
}
