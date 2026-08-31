import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ORDER_STATUS } from '../../constants/orderStatus.js'
import { getProductById } from '../../data/mockData.js'
import { useCart } from '../../context/CartContext.jsx'

export default function OrderActions({ order }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [buyingAgain, setBuyingAgain] = useState(false)

  async function handleBuyAgain() {
    setBuyingAgain(true)
    // Re-look-up each product by id rather than trusting the order's
    // snapshotted price/stock, since both may have changed since the order
    // was placed. Products that no longer exist are skipped rather than
    // failing the whole action.
    const lookups = await Promise.all(order.items.map((item) => getProductById(item.productId)))
    lookups.forEach((product, i) => {
      if (product) addItem(product, order.items[i].quantity)
    })
    setBuyingAgain(false)
    navigate('/cart')
  }

  const buttonBase =
    'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors text-center'
  const primary = `${buttonBase} bg-pb-green text-white hover:bg-pb-green-dark`
  const secondary = `${buttonBase} border border-pb-green text-pb-green hover:bg-pb-green-light`
  const disabled = `${buttonBase} border border-pb-gray-border text-pb-gray-muted cursor-not-allowed`

  if (order.status === ORDER_STATUS.DELIVERED) {
    return (
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleBuyAgain} disabled={buyingAgain} className={primary}>
          {buyingAgain ? 'Adding…' : 'Buy Again'}
        </button>
        <Link to="/" className={secondary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/" className={primary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.DELIVERY_FEE_QUOTED) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" disabled className={disabled} title="Coming soon">
          Review Delivery Fee
        </button>
        <Link to="/" className={secondary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.DELIVERY_FEE_PENDING) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/support" className={secondary}>
          Contact PowerBase Support
        </Link>
        <Link to="/" className={primary}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/" className={secondary}>
        Continue Shopping
      </Link>
    </div>
  )
}
