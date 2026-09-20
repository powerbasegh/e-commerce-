import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SearchResultsPage from './pages/SearchResultsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
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
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage.jsx'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage.jsx'
import AdminDeliveryPage from './pages/admin/AdminDeliveryPage.jsx'
import AdminSettlementsPage from './pages/admin/AdminSettlementsPage.jsx'
import AdminVendorsPage from './pages/admin/AdminVendorsPage.jsx'
import AdminVendorDetailPage from './pages/admin/AdminVendorDetailPage.jsx'
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx'
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage.jsx'
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage.jsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx'
import VendorProductsPage from './pages/vendor/VendorProductsPage.jsx'
import VendorProductFormPage from './pages/vendor/VendorProductFormPage.jsx'
import VendorInventoryPage from './pages/vendor/VendorInventoryPage.jsx'
import VendorOrdersPage from './pages/vendor/VendorOrdersPage.jsx'
import VendorOrderDetailPage from './pages/vendor/VendorOrderDetailPage.jsx'
import VendorEarningsPage from './pages/vendor/VendorEarningsPage.jsx'
import VendorSettlementsPage from './pages/vendor/VendorSettlementsPage.jsx'
import VendorProfilePage from './pages/vendor/VendorProfilePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { RequireRole } from './components/RouteGuards.jsx'

// Scope note: Customer Homepage, Product Details, Cart, Checkout, Order
// Tracking, Customer Account/Profile, real authentication, a full Vendor UI,
// and a full Admin UI (orders, payments, delivery, settlements, vendors,
// customers, products, categories, notifications, settings) are wired up.
// Real payment-provider integration (Paystack/Hubtel) and refund automation
// are still out of scope — see PROJECT_NOTES.md and AdminPaymentsPage.jsx.
//
// Route order below is for readability only — React Router v6 ranks a
// static path segment ('/orders/track') higher than a dynamic one
// ('/orders/:orderNumber') automatically, so the literal URL "/orders/track"
// always resolves to the lookup page regardless of declaration order.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/orders" element={<OrderHistoryPage />} />
      <Route path="/orders/track" element={<OrderTrackingLookupPage />} />
      <Route path="/orders/:orderNumber" element={<OrderDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Account pages work for guests too (locally persisted, as before) —
          not gated behind RequireAuth so that existing guest behavior isn't
          removed. Logging in upgrades addresses/notifications to the
          backend automatically (see AccountContext.jsx). */}
      <Route path="/account" element={<AccountDashboardPage />} />
      <Route path="/account/profile" element={<AccountProfilePage />} />
      <Route path="/account/addresses" element={<AccountAddressesPage />} />
      <Route path="/account/orders" element={<AccountOrdersPage />} />
      <Route path="/account/notifications" element={<AccountNotificationsPage />} />
      <Route path="/account/settings" element={<AccountSettingsPage />} />
      {/* Admin area — every route requires an authenticated ADMIN; the
          backend independently enforces the same role on every /api/admin
          endpoint (see server/src/middleware/auth.js and adminRoutes.js). */}
      <Route
        path="/admin"
        element={
          <RequireRole role="ADMIN">
            <AdminDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RequireRole role="ADMIN">
            <AdminOrdersPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <RequireRole role="ADMIN">
            <AdminOrderDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RequireRole role="ADMIN">
            <AdminPaymentsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/delivery"
        element={
          <RequireRole role="ADMIN">
            <AdminDeliveryPage />
          </RequireRole>
        }
      />
      {/* Old path kept working for anyone with it bookmarked. */}
      <Route
        path="/admin/delivery-fees"
        element={
          <RequireRole role="ADMIN">
            <AdminDeliveryPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/settlements"
        element={
          <RequireRole role="ADMIN">
            <AdminSettlementsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <RequireRole role="ADMIN">
            <AdminVendorsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/vendors/:id"
        element={
          <RequireRole role="ADMIN">
            <AdminVendorDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <RequireRole role="ADMIN">
            <AdminCustomersPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/customers/:id"
        element={
          <RequireRole role="ADMIN">
            <AdminCustomerDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/products"
        element={
          <RequireRole role="ADMIN">
            <AdminProductsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RequireRole role="ADMIN">
            <AdminCategoriesPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <RequireRole role="ADMIN">
            <AdminNotificationsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RequireRole role="ADMIN">
            <AdminSettingsPage />
          </RequireRole>
        }
      />
      {/* Vendor area — every route requires an authenticated VENDOR; the
          backend independently enforces the same role on every /api/vendor
          and /api/orders/vendor/* endpoint (see server/src/middleware/auth.js). */}
      <Route
        path="/vendor"
        element={
          <RequireRole role="VENDOR">
            <VendorDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <RequireRole role="VENDOR">
            <VendorProductsPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/products/new"
        element={
          <RequireRole role="VENDOR">
            <VendorProductFormPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/products/:id/edit"
        element={
          <RequireRole role="VENDOR">
            <VendorProductFormPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/inventory"
        element={
          <RequireRole role="VENDOR">
            <VendorInventoryPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <RequireRole role="VENDOR">
            <VendorOrdersPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/orders/:id"
        element={
          <RequireRole role="VENDOR">
            <VendorOrderDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/earnings"
        element={
          <RequireRole role="VENDOR">
            <VendorEarningsPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/settlements"
        element={
          <RequireRole role="VENDOR">
            <VendorSettlementsPage />
          </RequireRole>
        }
      />
      <Route
        path="/vendor/profile"
        element={
          <RequireRole role="VENDOR">
            <VendorProfilePage />
          </RequireRole>
        }
      />
    </Routes>
  )
}
