import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const FEATURES = [
  ['checkCircle', 'Top Quality Products'],
  ['tag', 'Best Prices Always'],
  ['delivery', 'Fast & Reliable Delivery'],
]

export default function SavingsCard() {
  return (
    <aside aria-label="Today's savings" className="hidden w-[220px] flex-col justify-between overflow-hidden rounded-card border border-pb-gray-border bg-[#eef8f1] p-5 xl:flex">
      <div>
        <p className="text-[23px] font-extrabold leading-[1.05] tracking-[-0.04em] text-pb-gray-text">Big Savings<br />Today!</p>
        <p className="mt-3 text-xs leading-5 text-pb-gray-muted">Selected deals on products you use every day.</p>
        <ul className="mt-6 space-y-4">
          {FEATURES.map(([icon, title]) => (
            <li key={title} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-pb-green/15 bg-white text-pb-green"><Icon name={icon} size={15} /></span>
              <span className="text-[10px] font-bold leading-tight text-pb-gray-text">{title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5">
        <div className="relative mx-auto mb-4 h-24 w-28">
          <span className="absolute bottom-1 left-2 h-16 w-20 rounded-xl bg-white shadow-sm" />
          <img src="/products/handbag.svg" alt="Featured PowerBase product" className="absolute bottom-0 left-4 h-24 w-24 object-contain" />
          <span className="absolute right-0 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-pb-green text-white shadow-sm"><Icon name="tag" size={18} /></span>
        </div>
        <Link to="/flash-deals" className="flex w-full items-center justify-center gap-2 rounded-lg bg-pb-green py-2.5 text-xs font-extrabold text-white hover:bg-pb-green-dark">
          Explore Deals <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </aside>
  )
}
