import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import EmptyCart from '../components/EmptyCart.jsx'
import CartLineItem from '../components/CartLineItem.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import MobileCartSummaryBar from '../components/MobileCartSummaryBar.jsx'
import { useCart, computeCartSummary } from '../context/CartContext.jsx'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalCount, incrementItem, decrementItem, removeItem } = useCart()

  const summary = computeCartSummary(items)

  // Checkout isn't built yet (explicitly out of scope for this phase) — the
  // button is wired up structurally so a real Checkout page can be dropped
  // in behind it later without touching this page again.
  function handleCheckout() {
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={3} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-5 px-6 py-6 lg:flex">
        <div>
          <h1 className="text-xl font-bold text-pb-gray-text">Shopping Cart</h1>
          <p className="text-sm text-pb-gray-muted">
            {totalCount} {totalCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
            <div className="flex flex-col gap-4">
              <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
                <header className="flex items-center justify-between border-b border-pb-gray-border px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><span className="text-xs font-extrabold">P</span></span><div><p className="text-sm font-extrabold text-pb-gray-text">PowerBase Order</p><p className="text-[10px] text-pb-gray-muted">All selected products in one cart</p></div></div>
                  <span className="text-xs font-bold text-pb-gray-muted">{totalCount} {totalCount === 1 ? 'item' : 'items'}</span>
                </header>
                <div className="divide-y divide-pb-gray-border px-4 sm:px-5">
                  {items.map((item) => <CartLineItem key={item.productId} item={item} onIncrement={incrementItem} onDecrement={decrementItem} onRemove={removeItem} />)}
                </div>
              </section>
            </div>

            <div className="sticky top-6">
              <OrderSummary summary={summary} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — own structure, sticky checkout bar takes the place */}
      {/* of the bottom tab nav on this page, same pattern as Product Details */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />

        <main className={`flex flex-col gap-4 px-4 pt-3 ${items.length === 0 ? 'pb-6' : 'pb-28'}`}>
          <div>
            <h1 className="text-lg font-bold text-pb-gray-text">Shopping Cart</h1>
            <p className="text-xs text-pb-gray-muted">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <>
              <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
                <header className="flex items-center justify-between border-b border-pb-gray-border px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><span className="text-xs font-extrabold">P</span></span><div><p className="text-sm font-extrabold text-pb-gray-text">PowerBase Order</p><p className="text-[10px] text-pb-gray-muted">All selected products in one cart</p></div></div>
                  <span className="text-xs font-bold text-pb-gray-muted">{totalCount} {totalCount === 1 ? 'item' : 'items'}</span>
                </header>
                <div className="divide-y divide-pb-gray-border px-4 sm:px-5">
                  {items.map((item) => <CartLineItem key={item.productId} item={item} onIncrement={incrementItem} onDecrement={decrementItem} onRemove={removeItem} />)}
                </div>
              </section>
              <OrderSummary summary={summary} onCheckout={handleCheckout} hideButton />
            </>
          )}
        </main>

        {items.length > 0 && <MobileCartSummaryBar summary={summary} onCheckout={handleCheckout} />}
      </div>
    </div>
  )
}
