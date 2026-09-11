import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

export default function HomeHero({ variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <section className="overflow-hidden rounded-card bg-pb-navy">
        <div className="flex items-center gap-4 px-5 py-6">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug text-white">Shop what you need.</p>
            <p className="mt-1 text-xs text-white/70">Electronics, fashion, home and more — delivered to you.</p>
            <Link
              to="/search"
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-pb-green px-4 py-2 text-xs font-semibold text-white"
            >
              Start Shopping
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          <img src="/hero-delivery.svg" alt="" className="h-24 w-24 shrink-0 object-contain" />
        </div>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-3">
      <section className="relative flex items-center overflow-hidden rounded-card bg-pb-navy px-10">
        <div className="max-w-md py-10">
          <p className="text-3xl font-extrabold leading-tight text-white">Shop what you need.</p>
          <p className="mt-3 text-sm text-white/70">
            Electronics, fashion, home essentials and more, delivered to your door anywhere in Ghana.
          </p>
          <Link
            to="/search"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-pb-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
          >
            Start Shopping
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        <img src="/hero-delivery.svg" alt="" className="absolute -right-6 bottom-0 h-56 w-56 object-contain opacity-90" />
      </section>

      <div className="flex flex-col gap-3">
        <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-card border border-pb-gray-border bg-white px-4 py-4">
          <Icon name="delivery" size={20} className="text-pb-green" />
          <p className="text-sm font-semibold text-pb-gray-text">Delivery nationwide</p>
          <p className="text-xs text-pb-gray-muted">We deliver to every region in Ghana.</p>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-card border border-pb-gray-border bg-white px-4 py-4">
          <Icon name="secure" size={20} className="text-pb-green" />
          <p className="text-sm font-semibold text-pb-gray-text">Secure payments</p>
          <p className="text-xs text-pb-gray-muted">Pay safely, every time you order.</p>
        </div>
      </div>
    </div>
  )
}
