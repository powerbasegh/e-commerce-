import { useEffect, useState } from 'react'
import AccountLayout from '../components/account/AccountLayout.jsx'
import AccountWelcomeSection from '../components/account/AccountWelcomeSection.jsx'
import AccountSummaryCard from '../components/account/AccountSummaryCard.jsx'
import AccountQuickActions from '../components/account/AccountQuickActions.jsx'
import AccountMobileMenuList from '../components/account/AccountMobileMenuList.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getOrders } from '../data/orderStorage.js'
import { ORDER_STATUS } from '../constants/orderStatus.js'
import { api } from '../services/api.js'
import { adaptOrderSummary } from '../data/orderApiAdapter.js'

export default function AccountDashboardPage() {
  const { profile, addresses } = useAccount()
  const { isAuthenticated, user } = useAuth()

  // Real order counts only — from the backend for a logged-in customer,
  // from local storage for a guest. Never invented.
  const [orders, setOrders] = useState(() => (isAuthenticated ? [] : getOrders()))

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders(getOrders())
      return
    }
    let cancelled = false
    api
      .getOrders()
      .then((data) => {
        if (!cancelled) setOrders((data.orders || []).map(adaptOrderSummary))
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const totalOrders = orders.length
  const ordersAwaitingDeliveryFee = orders.filter(
    (order) => order.status === ORDER_STATUS.DELIVERY_FEE_PENDING,
  ).length

  const displayName = profile.fullName || user?.fullName || 'there'

  return (
    <AccountLayout activeId="dashboard" title="My Account" showMobileBack={false}>
      <AccountWelcomeSection name={displayName} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AccountSummaryCard icon="orders" label="Total Orders" value={totalOrders} />
        <AccountSummaryCard
          icon="delivery"
          label="Orders Awaiting Delivery Fee"
          value={ordersAwaitingDeliveryFee}
        />
        <AccountSummaryCard icon="location" label="Saved Addresses" value={addresses.length} />
      </div>

      <AccountQuickActions />

      {/* Mobile-only section list — desktop already has the sidebar nav */}
      <div className="lg:hidden">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pb-gray-muted">
          My Account
        </p>
        <AccountMobileMenuList />
      </div>
    </AccountLayout>
  )
}
