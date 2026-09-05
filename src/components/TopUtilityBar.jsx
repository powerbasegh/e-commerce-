import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

// Thin utility strip above the main header — service reassurance on the
// left, PowerBase-level utility links on the right. Desktop only; the
// mobile header covers the equivalent actions (menu, search, cart) in a
// more compact way, so this strip would just add clutter on small screens.
export default function TopUtilityBar() {
  return (
    <div className="hidden bg-pb-green-dark text-white lg:block">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-4 py-1 text-[10px]">
        <ul className="flex items-center gap-3">
          <li className="flex items-center gap-1.5">
            <Icon name="shield" size={13} />
            100% Secure Payments
          </li>
        </ul>

        <p className="flex items-center gap-1.5">
          Free delivery on orders above GH₵300
        </p>

        <ul className="flex items-center gap-3">
          <li>
            <Link to="/vendor/apply" className="flex items-center gap-1.5 hover:text-pb-green-light">
              Sell on PowerBase
            </Link>
          </li>
          <li className="border-l border-white/20 pl-3">
            <Link to="/support" className="flex items-center gap-1.5 hover:text-pb-green-light">
              Customer Support
            </Link>
          </li>
          <li className="border-l border-white/20 pl-3">
            <Link to="/orders/track" className="flex items-center gap-1.5 hover:text-pb-green-light">
              Track Order
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
