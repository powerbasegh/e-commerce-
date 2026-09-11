import { Link } from 'react-router-dom'

export default function BrandLogo({ compact = false, light = false, to = '/', className = '' }) {
  return (
    <Link
      to={to}
      aria-label="PowerBase home"
      className={`group inline-flex shrink-0 items-center gap-2 ${className}`}
    >
      <img
        src="/logo-powerbase.png"
        alt=""
        aria-hidden="true"
        className={`shrink-0 object-contain ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      />
      <span
        className={`font-extrabold tracking-tight ${compact ? 'text-[17px]' : 'text-[19px]'} ${
          light ? 'text-white' : 'text-pb-navy'
        }`}
      >
        Power<span className="text-pb-green">Base</span>
      </span>
    </Link>
  )
}
