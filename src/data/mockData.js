// ---------------------------------------------------------------------------
// TEMPORARY MOCK DATA LAYER
// ---------------------------------------------------------------------------
// This project has no existing backend/API yet, so the homepage is wired
// against this mock data instead of fake inline business logic scattered
// through components. Every place that will eventually need a real API call
// reads from here through the small "service" functions at the bottom.
//
// When the real backend/API exists, replace the bodies of the functions
// below (getCategories, getFlashDeals, getRecommendedProducts, getProductById)
// with
// real fetch/axios calls that return the same shape. No component code
// should need to change.
// ---------------------------------------------------------------------------

export const categories = [
  { id: 'electronics', name: 'Electronics', icon: 'electronics' },
  { id: 'phones-tablets', name: 'Phones & Tablets', icon: 'phone' },
  { id: 'computing', name: 'Computing', icon: 'computing' },
  { id: 'fashion', name: 'Fashion', icon: 'fashion' },
  { id: 'home-living', name: 'Home & Living', icon: 'home' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: 'beauty' },
  { id: 'health-wellness', name: 'Health & Wellness', icon: 'health' },
  { id: 'sports-outdoors', name: 'Sports & Outdoors', icon: 'sports' },
  { id: 'baby-products', name: 'Baby Products', icon: 'baby' },
  { id: 'automotive', name: 'Automotive', icon: 'automotive' },
  { id: 'toys-games', name: 'Toys & Games', icon: 'toys' },
  { id: 'books-stationery', name: 'Books & Stationery', icon: 'books' },
  { id: 'groceries', name: 'Groceries', icon: 'groceries' },
  { id: 'more', name: 'More Categories', icon: 'more' },
]

// Mobile category row uses a shorter, higher-traffic subset per the design spec.
export const mobileCategories = [
  { id: 'electronics', name: 'Electronics', icon: 'electronics' },
  { id: 'fashion', name: 'Fashion', icon: 'fashion' },
  { id: 'home-living', name: 'Home & Living', icon: 'home' },
  { id: 'beauty', name: 'Beauty', icon: 'beauty' },
  { id: 'more', name: 'More', icon: 'more' },
]

export const heroSlides = [
  {
    id: 1,
    eyebrow: null,
    title: ['Everything you need,', 'from trusted vendors', 'delivered to you.'],
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
    image: '/hero-delivery.svg',
  },
]

export const trustFeatures = [
  { id: 'secure-payments', label: 'Secure Payments', icon: 'secure' },
  { id: 'buyer-protection', label: 'Buyer Protection', icon: 'shield' },
  { id: 'reliable-delivery', label: 'Reliable Delivery', icon: 'delivery' },
  { id: 'top-vendors', label: 'Top Vendors', icon: 'vendors' },
]

// Bottom-of-homepage trust/benefits strip (TrustBenefits.jsx).
export const trustSection = [
  {
    id: 'trusted-thousands',
    icon: 'award',
    title: 'Trusted by Thousands',
    description: 'Happy customers across Ghana',
  },
  {
    id: 'easy-returns',
    icon: 'returns',
    title: 'Easy Returns',
    description: '7-day return policy',
  },
  {
    id: 'quality-guaranteed',
    icon: 'checkCircle',
    title: 'Quality Guaranteed',
    description: '100% original products',
  },
  {
    id: 'shop-confidence',
    icon: 'lock',
    title: 'Shop with Confidence',
    description: 'Your security is our priority',
  },
]

// Condensed trust list used in the cart panel and mobile trust block.
export const trustSectionShort = [
  { id: 'secure-payments', icon: 'secure', title: 'Secure Payments', description: 'Your payments are safe with us' },
  { id: 'buyer-protection', icon: 'shield', title: 'Buyer Protection', description: 'Get your money back' },
  { id: 'reliable-delivery', icon: 'delivery', title: 'Reliable Delivery', description: 'Fast delivery to your door' },
  { id: 'support', icon: 'support', title: '24/7 Customer Support', description: 'We are here to help' },
]

// Used on the product detail page's "PowerBase Buyer Protection" block.
export const buyerProtectionFeatures = [
  { id: 'secure-payments', icon: 'secure', title: 'Secure Payments', description: 'Your payment info is encrypted and protected' },
  { id: 'buyer-protection', icon: 'shield', title: 'Buyer Protection', description: 'Full refund if the item is not as described' },
  { id: 'verified-vendors', icon: 'vendors', title: 'Verified Vendors', description: 'This vendor has been reviewed by PowerBase' },
  { id: 'reliable-delivery', icon: 'delivery', title: 'Reliable Delivery', description: 'Tracked delivery to your doorstep' },
]

export const promoCards = [
  {
    id: 'top-vendors',
    icon: 'vendors',
    title: 'Top Vendors',
    text: 'Shop from trusted vendors',
    ctaLabel: 'View Vendors',
    ctaHref: '/vendors',
    tone: 'green',
  },
  {
    id: 'free-delivery',
    icon: 'delivery',
    title: 'Doorstep Delivery',
    text: 'Delivery fee confirmed after location review',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
    tone: 'amber',
  },
  {
    id: 'buyer-protection',
    icon: 'shield',
    title: 'Buyer Protection',
    text: 'Your satisfaction is our priority',
    ctaLabel: 'Learn More',
    ctaHref: '/buyer-protection',
    tone: 'blue',
  },
]

// ---------------------------------------------------------------------------
// Shared product catalog
// ---------------------------------------------------------------------------
// Single source of truth for every product shown anywhere in the app
// (Flash Deals rail, Recommended rail, product detail page, related
// products). Homepage sections below are *derived* from this array by
// dealType, rather than kept as separate hardcoded lists, so a product only
// needs to be defined once.
//
// vendorRegistry is kept separate and referenced by id so a vendor's data
// isn't duplicated across every one of their products.
// ---------------------------------------------------------------------------

export const vendorRegistry = {
  'v-technova': {
    id: 'v-technova',
    name: 'TechNova Store',
    rating: 4.7,
    location: 'Accra, Ghana',
    productCount: 128,
    verified: true,
  },
  'v-stridewalk': {
    id: 'v-stridewalk',
    name: 'StrideWalk Footwear',
    rating: 4.6,
    location: 'Kumasi, Ghana',
    productCount: 64,
    verified: true,
  },
  'v-homeandco': {
    id: 'v-homeandco',
    name: 'Home & Co.',
    rating: 4.5,
    location: 'Accra, Ghana',
    productCount: 210,
    verified: true,
  },
  'v-urbanpack': {
    id: 'v-urbanpack',
    name: 'Urban Pack Gear',
    rating: 4.4,
    location: 'Tema, Ghana',
    productCount: 47,
    verified: false,
  },
}

const rawProducts = [
  {
    id: 'fd-1',
    name: 'Bluetooth Speaker',
    price: 180,
    oldPrice: 240,
    rating: 4.5,
    reviewCount: 86,
    image: '/products/speaker.svg',
    dealType: 'flash',
    stock: 24,
    vendorId: 'v-technova',
    category: { id: 'electronics', name: 'Electronics' },
    description:
      'A compact Bluetooth speaker with rich bass and up to 10 hours of playtime, built for everyday listening at home or on the move.',
    specs: [
      { label: 'Connectivity', value: 'Bluetooth 5.0' },
      { label: 'Battery Life', value: 'Up to 10 hours' },
      { label: 'Water Resistance', value: 'IPX5' },
      { label: 'Weight', value: '420g' },
    ],
  },
  {
    id: 'fd-2',
    name: 'Casual Sneakers',
    price: 250,
    oldPrice: 320,
    rating: 4.6,
    reviewCount: 152,
    image: '/products/sneakers.svg',
    dealType: 'flash',
    stock: 40,
    vendorId: 'v-stridewalk',
    category: { id: 'fashion', name: 'Fashion' },
    description:
      'Everyday casual sneakers with a breathable knit upper and cushioned sole, made for all-day comfort.',
    specs: [
      { label: 'Material', value: 'Knit textile upper' },
      { label: 'Sole', value: 'Rubber, cushioned' },
      { label: 'Available Sizes', value: '38 – 45' },
      { label: 'Closure', value: 'Lace-up' },
    ],
  },
  {
    id: 'fd-3',
    name: 'Smart Watch',
    price: 320,
    oldPrice: 400,
    rating: 4.7,
    reviewCount: 203,
    image: '/products/smartwatch.svg',
    dealType: 'flash',
    stock: 15,
    vendorId: 'v-technova',
    category: { id: 'electronics', name: 'Electronics' },
    description:
      'Track workouts, heart rate, and notifications on a bright always-on display, with up to 5 days of battery life.',
    specs: [
      { label: 'Display', value: '1.4" AMOLED' },
      { label: 'Battery Life', value: 'Up to 5 days' },
      { label: 'Water Resistance', value: '5 ATM' },
      { label: 'Compatibility', value: 'Android & iOS' },
    ],
  },
  {
    id: 'fd-4',
    name: 'Backpack',
    price: 150,
    oldPrice: 200,
    rating: 4.4,
    reviewCount: 61,
    image: '/products/backpack.svg',
    dealType: 'flash',
    stock: 33,
    vendorId: 'v-urbanpack',
    category: { id: 'fashion', name: 'Fashion' },
    description:
      'A durable everyday backpack with a padded laptop sleeve and multiple compartments for work, travel, or school.',
    specs: [
      { label: 'Capacity', value: '25L' },
      { label: 'Laptop Sleeve', value: 'Fits up to 15.6"' },
      { label: 'Material', value: 'Water-resistant polyester' },
    ],
  },
  {
    id: 'fd-5',
    name: 'LED Desk Lamp',
    price: 120,
    oldPrice: 160,
    rating: 4.5,
    reviewCount: 44,
    image: '/products/lamp.svg',
    dealType: 'flash',
    stock: 50,
    vendorId: 'v-homeandco',
    category: { id: 'home-living', name: 'Home & Living' },
    description:
      'An adjustable LED desk lamp with three brightness levels and a flicker-free, eye-friendly design.',
    specs: [
      { label: 'Brightness Levels', value: '3' },
      { label: 'Power Source', value: 'USB-C' },
      { label: 'Adjustable Arm', value: 'Yes' },
    ],
  },
  {
    id: 'fd-6',
    name: 'Wireless Earbuds',
    price: 120,
    oldPrice: 150,
    rating: 4.6,
    reviewCount: 97,
    image: '/products/earbuds.svg',
    dealType: 'flash',
    stock: 60,
    vendorId: 'v-technova',
    category: { id: 'electronics', name: 'Electronics' },
    description:
      'True wireless earbuds with clear call quality and a compact charging case for all-day use.',
    specs: [
      { label: 'Connectivity', value: 'Bluetooth 5.2' },
      { label: 'Battery Life', value: '6h (24h with case)' },
      { label: 'Water Resistance', value: 'IPX4' },
    ],
  },
  {
    id: 'rp-1',
    name: "Men's Watch",
    price: 200,
    rating: 4.5,
    reviewCount: 38,
    image: '/products/mens-watch.svg',
    dealType: 'recommended',
    stock: 18,
    vendorId: 'v-technova',
    category: { id: 'fashion', name: 'Fashion' },
    description:
      'A classic analog watch with a stainless steel case and leather strap, suitable for both work and everyday wear.',
    specs: [
      { label: 'Case Material', value: 'Stainless steel' },
      { label: 'Strap', value: 'Genuine leather' },
      { label: 'Water Resistance', value: '3 ATM' },
    ],
  },
  {
    id: 'rp-2',
    name: 'LED TV 32"',
    price: 900,
    rating: 4.6,
    reviewCount: 71,
    image: '/products/tv.svg',
    dealType: 'recommended',
    stock: 9,
    vendorId: 'v-technova',
    category: { id: 'electronics', name: 'Electronics' },
    description:
      'A 32-inch LED TV with crisp HD picture quality, multiple HDMI ports, and built-in streaming apps.',
    specs: [
      { label: 'Screen Size', value: '32 inch' },
      { label: 'Resolution', value: 'HD 1366×768' },
      { label: 'Ports', value: '2× HDMI, 1× USB' },
    ],
  },
  {
    id: 'rp-3',
    name: 'Handbag',
    price: 180,
    rating: 4.3,
    reviewCount: 29,
    image: '/products/handbag.svg',
    dealType: 'recommended',
    stock: 22,
    vendorId: 'v-urbanpack',
    category: { id: 'fashion', name: 'Fashion' },
    description:
      'A structured handbag with a spacious main compartment and an interior pocket, finished in durable faux leather.',
    specs: [
      { label: 'Material', value: 'Faux leather' },
      { label: 'Compartments', value: '1 main, 1 interior pocket' },
    ],
  },
  {
    id: 'rp-4',
    name: 'Wireless Earbuds',
    price: 120,
    rating: 4.4,
    reviewCount: 54,
    image: '/products/earbuds-2.svg',
    dealType: 'recommended',
    stock: 45,
    vendorId: 'v-technova',
    category: { id: 'electronics', name: 'Electronics' },
    description:
      'Lightweight wireless earbuds with a secure fit and balanced sound, ideal for workouts and commutes.',
    specs: [
      { label: 'Connectivity', value: 'Bluetooth 5.1' },
      { label: 'Battery Life', value: '5h (20h with case)' },
    ],
  },
  {
    id: 'rp-5',
    name: 'Air Fryer',
    price: 450,
    rating: 4.6,
    reviewCount: 112,
    image: '/products/airfryer.svg',
    dealType: 'recommended',
    stock: 12,
    vendorId: 'v-homeandco',
    category: { id: 'home-living', name: 'Home & Living' },
    description:
      'A 4.5L air fryer that cooks with little to no oil, with 8 preset cooking programs and an easy-clean basket.',
    specs: [
      { label: 'Capacity', value: '4.5L' },
      { label: 'Presets', value: '8 cooking programs' },
      { label: 'Power', value: '1400W' },
    ],
  },
  {
    id: 'rp-6',
    name: 'Blender',
    price: 220,
    rating: 4.5,
    reviewCount: 67,
    image: '/products/blender.svg',
    dealType: 'recommended',
    stock: 20,
    vendorId: 'v-homeandco',
    category: { id: 'home-living', name: 'Home & Living' },
    description:
      'A powerful countertop blender with multiple speed settings, suited for smoothies, soups, and sauces.',
    specs: [
      { label: 'Jar Capacity', value: '1.5L' },
      { label: 'Speed Settings', value: '3 + pulse' },
      { label: 'Power', value: '600W' },
    ],
  },
]

export const products = rawProducts.map((p) => ({
  ...p,
  discountPercent:
    p.oldPrice != null ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null,
  vendor: vendorRegistry[p.vendorId],
  gallery: [p.image, p.image, p.image],
}))

export const flashDeals = products.filter((p) => p.dealType === 'flash')

export const recommendedProducts = products.filter((p) => p.dealType === 'recommended')

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
// A small shared pool of review templates reused across products so every
// product detail page has believable review content without needing a
// hand-written set per product.

const reviewPool = [
  { author: 'Ama O.', daysAgo: 4, verified: true, rating: 5, comment: 'Exactly as described and arrived faster than expected. Very happy with this purchase.' },
  { author: 'Kojo B.', daysAgo: 11, verified: true, rating: 4, comment: 'Good quality for the price. Packaging could be better but the product itself is solid.' },
  { author: 'Efua M.', daysAgo: 19, verified: false, rating: 5, comment: 'Works perfectly. Vendor was responsive when I had a question before ordering.' },
  { author: 'Yaw D.', daysAgo: 27, verified: true, rating: 3, comment: "It's decent, though I expected slightly better build quality at this price point." },
]

export function getReviews(productId) {
  const product = products.find((p) => p.id === productId)
  if (!product) return { average: 0, total: 0, breakdown: [], reviews: [] }

  const reviews = reviewPool.map((r, i) => ({ id: `${productId}-review-${i}`, ...r }))
  const total = product.reviewCount ?? reviews.length
  const average = product.rating

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const weight = stars === Math.round(average) ? 0.5 : stars === 5 ? 0.3 : 0.1
    return { stars, percent: Math.round(weight * 100) }
  })

  return { average, total, breakdown, reviews }
}

// Note: cart data now lives in the global cart (see src/context/CartContext.jsx),
// not here. This file previously seeded a mock cartItems array with a
// getCart()/computeCartTotals() pair — those were removed once the real
// cart shipped, so nothing in the app pretends to have a cart backend that
// doesn't exist.

export const currentUser = {
  name: 'Kwame Asare',
  avatar: null,
}

export const flashDealsEndsInSeconds = 2 * 3600 + 34 * 60 + 16

// ---------------------------------------------------------------------------
// Service functions — the seam where real API calls will be wired in later.
// Each currently resolves the local mock data on a microtask so components
// already consume them as async data (loading-state ready) without changes
// once real endpoints exist.
// ---------------------------------------------------------------------------

export async function getCategories() {
  return categories
}

export async function getFlashDeals() {
  return flashDeals
}

export async function getRecommendedProducts() {
  return recommendedProducts
}

export async function getProductById(id) {
  return products.find((p) => p.id === id) ?? null
}

export async function getRelatedProducts(product, limit = 6) {
  if (!product) return []
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category.id === product.category.id,
  )
  const fallback = products.filter((p) => p.id !== product.id)
  const pool = sameCategory.length > 0 ? sameCategory : fallback
  return pool.slice(0, limit)
}

export function formatGHS(amount) {
  // Guest order tracking (public API, no auth) deliberately omits some
  // financial fields for privacy/scope reasons — render those as "—"
  // instead of throwing on null.toFixed().
  if (amount == null || Number.isNaN(amount)) return '—'
  return `GH₵${amount.toFixed(2)}`
}
