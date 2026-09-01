import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AccountProvider } from './context/AccountContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider is outermost — AccountContext reads useAuth() to sync
          addresses/notifications with the backend once a customer is
          logged in, and CartContext/Checkout will read it too. */}
      <AuthProvider>
        <AccountProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
