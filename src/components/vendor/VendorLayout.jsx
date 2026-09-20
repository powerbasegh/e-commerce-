import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo.jsx'
import Icon from '../Icon.jsx'
import VendorNav from './VendorNav.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function VendorLayout({ title, actions, children }) {
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* -------------------------------------------------------------- */}
      {/* Desktop sidebar                                                  */}
      {/* -------------------------------------------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-pb-navy lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <BrandLogo compact light to="/vendor" />
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Vendor Portal</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{user?.fullName || 'Vendor'}</p>
        </div>
        <VendorNav />
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/60">
              <Icon name="logout" size={15} />
            </span>
            Log out
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------- */}
      {/* Mobile topbar + drawer                                          */}
      {/* -------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-pb-gray-border bg-pb-navy px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open vendor menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white active:bg-white/10"
        >
          <Icon name="menu" size={20} />
        </button>
        <BrandLogo compact light to="/vendor" />
        <Link
          to="/vendor/profile"
          aria-label="Store profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white active:bg-white/10"
        >
          <Icon name="user" size={19} />
        </Link>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-pb-navy">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <BrandLogo compact light to="/vendor" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 active:bg-white/10"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Vendor Portal</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{user?.fullName || 'Vendor'}</p>
            </div>
            <VendorNav onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/60">
                  <Icon name="logout" size={15} />
                </span>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Content                                                          */}
      {/* -------------------------------------------------------------- */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-pb-gray-text lg:text-2xl">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
