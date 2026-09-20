import Icon from '../Icon.jsx'

export default function StatCard({ icon, label, value, tone = 'default', hint }) {
  const toneStyles = {
    default: 'bg-pb-green-light text-pb-green-dark',
    amber: 'bg-pb-amber/10 text-pb-amber',
    red: 'bg-pb-red/10 text-pb-red',
  }
  return (
    <div className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneStyles[tone] || toneStyles.default}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-pb-gray-text">{value}</p>
      <p className="text-xs text-pb-gray-muted">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-pb-gray-muted">{hint}</p>}
    </div>
  )
}
