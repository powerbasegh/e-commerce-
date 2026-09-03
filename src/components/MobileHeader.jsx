import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import BrandLogo from './BrandLogo.jsx'
import { categories } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { totalCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  function submit(event) {
    event.preventDefault()
    const value = query.trim()
    if (value) navigate(`/shop?search=${encodeURIComponent(value)}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-pb-gray-border bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-3.5">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-pb-gray-text hover:bg-pb-gray-bg"><Icon name="menu" size={21} /></button>
          <BrandLogo compact />
          <Link to="/cart" aria-label="Cart" className="relative flex h-9 w-9 items-center justify-center"><Icon name="cart" size={21} className="text-pb-green" />{totalCount > 0 && <span className="header-badge right-0 top-0">{totalCount}</span>}</Link>
        </div>
        <form onSubmit={submit} className="mx-3.5 mb-3 flex h-10 overflow-hidden rounded-lg border border-pb-gray-border bg-pb-gray-bg focus-within:border-pb-green">
          <div className="flex flex-1 items-center px-3"><Icon name="search" size={16} className="text-pb-gray-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands and more" className="w-full bg-transparent px-2 text-xs outline-none" /></div>
          <button type="submit" aria-label="Search" className="w-11 bg-pb-green text-white"><Icon name="search" size={16} /></button>
        </form>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[84%] max-w-[340px] flex-col bg-white shadow-panel">
            <div className="flex items-center justify-between border-b border-pb-gray-border px-4 py-4"><BrandLogo compact /><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-pb-gray-bg"><Icon name="close" size={19} /></button></div>
            <div className="flex-1 overflow-y-auto p-3">
              <p className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-pb-gray-muted">Shop by category</p>
              {categories.filter((category) => category.id !== 'more').map((category) => (
                <Link key={category.id} onClick={() => setMenuOpen(false)} to={`/category/${category.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-pb-gray-text hover:bg-pb-green-light"><Icon name={category.icon} size={16} className="text-pb-gray-muted" /><span className="flex-1">{category.name}</span><Icon name="chevronRight" size={13} className="text-pb-gray-border" /></Link>
              ))}
            </div>
            <div className="border-t border-pb-gray-border p-4">
              <Link to={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)} className="flex items-center justify-center rounded-lg bg-pb-green py-3 text-xs font-extrabold text-white hover:bg-pb-green-dark">{user ? 'My Account' : 'Sign in to PowerBase'}</Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
