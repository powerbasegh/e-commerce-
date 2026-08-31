import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderSuccessPage from './pages/OrderSuccessPage.jsx'
import OrderHistoryPage from './pages/OrderHistoryPage.jsx'
import OrderTrackingLookupPage from './pages/OrderTrackingLookupPage.jsx'
import OrderDetailsPage from './pages/OrderDetailsPage.jsx'
import AccountDashboardPage from './pages/AccountDashboardPage.jsx'
import AccountProfilePage from './pages/AccountProfilePage.jsx'
import AccountAddressesPage from './pages/AccountAddressesPage.jsx'
import AccountOrdersPage from './pages/AccountOrdersPage.jsx'
import AccountNotificationsPage from './pages/AccountNotificationsPage.jsx'
import AccountSettingsPage from './pages/AccountSettingsPage.jsx'

// Scope note: Customer Homepage, Product Details, Cart, Checkout, Order
// Tracking, and Customer Account/Profile are wired up so far. Vendor and
// Admin experiences, real payment, and real backend/auth are intentionally
// out of scope for now (see PROJECT_NOTES.md).
//
// Route order below is for readability only — React Router v6 ranks a
// static path segment ('/orders/track') higher than a dynamic one
// ('/orders/:orderNumber') automatically, so the literal URL "/orders/track"
// always resolves to the lookup page regardless of declaration order.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/orders" element={<OrderHistoryPage />} />
      <Route path="/orders/track" element={<OrderTrackingLookupPage />} />
      <Route path="/orders/:orderNumber" element={<OrderDetailsPage />} />
      <Route path="/account" element={<AccountDashboardPage />} />
      <Route path="/account/profile" element={<AccountProfilePage />} />
      <Route path="/account/addresses" element={<AccountAddressesPage />} />
      <Route path="/account/orders" element={<AccountOrdersPage />} />
      <Route path="/account/notifications" element={<AccountNotificationsPage />} />
      <Route path="/account/settings" element={<AccountSettingsPage />} />
    </Routes>
  )
}
