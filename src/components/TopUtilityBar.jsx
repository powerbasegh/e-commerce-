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
            <Icon name="headphones" size={13} />
            24/7 Customer Support
          </li>
          <li className="flex items-center gap-1.5">
            <Icon name="truck" size={13} />
            Fast &amp; Reliable Delivery
          </li>
          <li className="flex items-center gap-1.5">
            <Icon name="tag" size={13} />
            Free delivery on orders above GH₵300
          </li>
        </ul>

        <ul className="flex items-center gap-3">
          <li>
            <Link to="/vendor/apply" className="flex items-center gap-1.5 hover:text-pb-green-light">
              <Icon name="vendors" size={13} />
              Sell on PowerBase
            </Link>
          </li>
          <li>
            <Link to="/orders/track" className="flex items-center gap-1.5 hover:text-pb-green-light">
              <Icon name="orders" size={13} />
              Track Order
            </Link>
          </li>
          <li className="flex items-center gap-1 border-l border-white/20 pl-4">
            Ghana
            <Icon name="chevronDown" size={12} />
          </li>
        </ul>
      </div>
    </div>
  )
}
