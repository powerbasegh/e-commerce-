import Icon from '../Icon.jsx'

export default function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="bell" size={36} strokeWidth={1.4} />
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text">You're all caught up</p>
        <p className="mt-1 text-sm text-pb-gray-muted">
          Order updates, delivery fee updates, and PowerBase announcements will show up here.
        </p>
      </div>
    </div>
  )
}
