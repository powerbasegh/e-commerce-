import AccountLayout from '../components/account/AccountLayout.jsx'
import NotificationItem from '../components/account/NotificationItem.jsx'
import EmptyNotifications from '../components/account/EmptyNotifications.jsx'
import { useState } from 'react'
import { useAccount } from '../context/AccountContext.jsx'

export default function AccountNotificationsPage() {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead, refreshFromApi } =
    useAccount()
  const [refreshing, setRefreshing] = useState(false)

  async function refreshNotifications() {
    setRefreshing(true)
    try { await refreshFromApi() } finally { setRefreshing(false) }
  }

  return (
    <AccountLayout activeId="notifications" title="Notifications">
      <div className="flex max-w-2xl flex-col gap-4">
        {notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-pb-gray-muted">
                {unreadNotificationCount > 0
                  ? `${unreadNotificationCount} unread`
                  : 'All caught up'}
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={refreshNotifications}
                  disabled={refreshing}
                  className="text-sm font-semibold text-pb-gray-muted hover:text-pb-gray-text disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-sm font-semibold text-pb-green hover:text-pb-green-dark"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markNotificationRead}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AccountLayout>
  )
}
