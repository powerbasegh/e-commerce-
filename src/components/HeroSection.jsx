import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const heroTrust = [
  { icon: 'secure', title: 'Secure Payments', text: 'Protected checkout' },
  { icon: 'shield', title: 'Buyer Protection', text: 'Shop with confidence' },
  { icon: 'truck', title: 'Reliable Delivery', text: 'Fast & on-time' },
]

const heroProducts = [
  ['/products/tv.svg', 'Smart TV'],
  ['/products/speaker.svg', 'Bluetooth Speaker'],
  ['/products/smartwatch.svg', 'Smart Watch'],
  ['/products/earbuds-2.svg', 'Wireless Earbuds'],
]

export default function HeroSection({ variant = 'desktop' }) {
  const mobile = variant === 'mobile'
  return (
    <section className={`relative overflow-hidden border ${mobile ? 'rounded-2xl border-pb-green-dark bg-pb-green-dark text-white' : 'min-h-[380px] rounded-card border-pb-gray-border bg-white shadow-card'}`}>
      {!mobile && <div className="absolute inset-y-0 right-0 w-[54%] bg-pb-green-light/45" aria-hidden="true" />}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {mobile ? <><span className="hero-ring hero-ring-1" /><span className="hero-ring hero-ring-2" /><span className="hero-ring hero-ring-3" /></> : <div className="absolute right-[4%] top-[10%] h-64 w-64 rounded-full border border-pb-green/10" />}
      </div>

      <div className={`relative z-10 ${mobile ? 'px-5 pb-4 pt-6' : 'flex min-h-[380px] flex-col justify-between px-8 py-8 xl:px-9'}`}>
        <div className={`${mobile ? 'max-w-[310px]' : 'max-w-[430px]'}`}>
          <p className={`font-extrabold uppercase tracking-[0.18em] text-pb-green ${mobile ? 'text-pb-green-light text-[9px]' : 'text-[10px]'}`}>POWERBASE PICKS</p>
          <h1 className={`mt-2 font-extrabold leading-[1.04] tracking-[-0.045em] ${mobile ? 'text-[25px] text-white' : 'text-[40px] text-pb-gray-text xl:text-[44px]'}`}>
            Everything you need,
            <span className="block text-pb-green">from trusted brands</span>
            <span className={`block ${mobile ? 'text-white' : ''}`}>delivered to you.</span>
          </h1>
          <p className={` ${mobile ? 'mt-3 max-w-[280px] text-[11px] leading-5 text-white/70' : 'mt-4 max-w-[360px] text-sm leading-6 text-pb-gray-muted'}`}>
            Quality products, fair prices and dependable delivery, all from PowerBase.
          </p>
          <Link to="/shop" className={`mt-5 inline-flex items-center gap-2 font-extrabold transition ${mobile ? 'rounded-lg bg-white px-4 py-2.5 text-xs text-pb-green-dark hover:bg-pb-green-light' : 'rounded-lg bg-pb-green px-5 py-3 text-sm text-white hover:bg-pb-green-dark'}`}>
            Shop Now <Icon name="arrowRight" size={15} />
          </Link>
        </div>

        <div className={`${mobile ? 'relative mt-3 h-32' : 'absolute bottom-20 right-2 h-[220px] w-[55%] min-w-[360px]'}`} aria-label="Featured PowerBase products">
          {!mobile && <div className="absolute bottom-2 left-[7%] h-24 w-[82%] rounded-[50%] bg-white shadow-[0_14px_30px_rgba(15,76,36,0.12)]" />}
          {heroProducts.map(([src, alt], index) => {
            const positions = mobile
              ? ['bottom-1 left-[3%] h-24 w-28', 'bottom-3 right-[4%] h-20 w-20', 'bottom-0 left-[48%] h-14 w-14', 'bottom-3 right-[25%] h-14 w-14']
              : ['bottom-8 left-[1%] h-[160px] w-[48%]', 'bottom-7 left-[43%] h-[126px] w-[28%]', 'bottom-1 right-[7%] h-[100px] w-[24%]', 'bottom-5 right-0 h-[82px] w-[20%]']
            return <img key={alt} src={src} alt={alt} className={`absolute object-contain drop-shadow-2xl ${positions[index]}`} />
          })}
        </div>

        <div className={`${mobile ? 'grid grid-cols-3 gap-2 border-t border-white/10 pt-3' : 'grid max-w-[620px] grid-cols-3 gap-5 border-t border-pb-gray-border pt-4'}`}>
          {heroTrust.map((item) => (
            <div key={item.title} className="flex min-w-0 items-center gap-2">
              <span className={`flex shrink-0 items-center justify-center rounded-full ${mobile ? 'h-7 w-7 bg-white/10 text-pb-green-light' : 'h-8 w-8 bg-pb-green-light text-pb-green'}`}><Icon name={item.icon} size={mobile ? 14 : 15} /></span>
              <div className="min-w-0 leading-tight">
                <p className={`truncate font-bold ${mobile ? 'text-[9px] text-white' : 'text-[11px] text-pb-gray-text'}`}>{item.title}</p>
                <p className={`truncate ${mobile ? 'text-[8px] text-white/55' : 'text-[9px] text-pb-gray-muted'}`}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
