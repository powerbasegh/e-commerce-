import { Navigate } from 'react-router-dom'

// /account/orders intentionally does not rebuild order history/tracking UI.
// The full Order History module already lives at /orders (see
// src/pages/OrderHistoryPage.jsx) and BottomNav/AccountNav both link there
// directly for the common case. This route exists only so
// /account/orders resolves to something (per the requested route list)
// without duplicating order functionality.
export default function AccountOrdersPage() {
  return <Navigate to="/orders" replace />
}
