import { Link } from 'react-router-dom'
import Header from '../Header.jsx'
import MobileHeader from '../MobileHeader.jsx'
import BottomNav from '../BottomNav.jsx'
import Breadcrumbs from '../Breadcrumbs.jsx'
import Icon from '../Icon.jsx'
import AccountNav from './AccountNav.jsx'
import { useAccount } from '../../context/AccountContext.jsx'

/**
 * Shared chrome for every /account/* page. Desktop: Header + account
 * sidebar + content. Mobile: MobileHeader + a simple back-to-account bar
 * (skipped on the dashboard itself) + content + BottomNav. Reused instead
 * of duplicated across the six account pages, matching the pattern already
 * used for the Order pages.
 */
export default function AccountLayout({ activeId, title, showMobileBack = true, children }) {
  const { unreadNotificationCount } = useAccount()

  const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account' }]
  if (title && title !== 'My Account') breadcrumbItems.push({ label: title })

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={unreadNotificationCount} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] items-start gap-6 px-6 py-6 lg:flex">
        <AccountNav activeId={activeId} />
        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-xl font-bold text-pb-gray-text">{title}</h1>
          {children}
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={unreadNotificationCount} />
        <main className="flex flex-col gap-4 px-4 pb-24 pt-3">
          {showMobileBack ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account"
                aria-label="Back to My Account"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-pb-gray-text active:bg-pb-gray-bg"
              >
                <Icon name="chevronRight" size={18} className="rotate-180" />
              </Link>
              <h1 className="text-lg font-bold text-pb-gray-text">{title}</h1>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-pb-gray-text">{title}</h1>
          )}
          {children}
        </main>
        <BottomNav activeId="account" />
      </div>
    </div>
  )
}
