# PowerBase — Customer Homepage (Phase 1)

## Important context for this delivery

You asked me to inspect the existing codebase before making any changes.
**There was no existing codebase to inspect** — only the two reference
images and the written spec were uploaded to this conversation. So this
isn't an edit of your real project; it's a fresh scaffold built strictly
to the spec, meant to be dropped into (or used to seed) your actual repo.

If you already have a PowerBase codebase elsewhere, send it next and I'll
do a proper inspection pass and reconcile this against it — file by file —
rather than you having to merge it manually.

## What was built

Customer Homepage only, as instructed. No vendor or admin UI.

- React 18 + Vite + Tailwind CSS
- `src/App.jsx` → `src/pages/HomePage.jsx` composes everything
- Desktop layout: `Sidebar` + main content + `CartPanel` (matches Image 1)
- Mobile layout: `MobileHeader` + `MobileSearch` + `Hero` + `MobileCategoryRow`
  + product sections + `PromoCards` + `TrustSection` + `BottomNav`
  (matches Image 2) — built as its own structure, not a shrunk desktop copy
- Shared pieces reused by both: `Hero`, `ProductCard`, `ProductSection`,
  `PromoCards`, `TrustSection`, `CountdownTimer`, `StarRating`, `Icon`

## Functionality: what's real vs. mocked

There's no backend yet, so nothing here is a "fake business logic" stand-in —
it's all isolated in one place: **`src/data/mockData.js`**. Every product,
category, cart item, and the `getFlashDeals` / `getRecommendedProducts` /
`getCart` functions live there. When your real API exists, only that file
needs to change — no component should need touching, since components call
the `get*` functions, not fixed arrays.

Not connected (there's nothing to connect to yet):
- Search doesn't fetch results
- Wishlist button has no state
- Cart is read-only mock data (no add/remove yet)
- Auth / account menu is static

## Assets

No product photos or the hero delivery-person photo were attached as
separate files — only the two full-mockup screenshots. I generated simple
placeholder SVGs (`public/products/*.svg`, `public/hero-delivery.svg`) so
the layout renders correctly and proportionally. **Swap these for your real
photography** — file names are already wired up in `mockData.js`, so
dropping in same-named files (or updating the paths) is all that's needed.

## I could not run the build in this environment

This sandbox has no network access, so `npm install` fails here (confirmed:
403 from the npm registry). I was not able to actually run
`npm install`, `npm run dev`, or `npm run build` to verify this compiles.
I reviewed every file by hand for import/export correctness, but you should
treat the first local build as the real test. To do that:

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
```

If the build throws anything, send me the error and I'll fix it in the next
turn before you commit.

## Suggested next steps

1. You run `npm install && npm run build` locally and confirm it's clean.
2. Drop in real product/hero images.
3. Point `mockData.js`'s service functions at your real API once it exists.
4. Then we move to the next phase (per your process: plan → approval →
   implement) — likely cart interactivity, checkout, or vendor onboarding.

---

## Phase 2 — Product Details Page

### What changed

- Added `react-router-dom` routing (`src/main.jsx` now wraps the app in
  `BrowserRouter`; `src/App.jsx` now defines `/` and `/product/:productId`).
  Homepage is unchanged at `/`.
- `ProductCard` now uses React Router's `Link` instead of a plain `<a>`, so
  clicking a card from the homepage navigates client-side to the product
  page. Everything else about `ProductCard` is untouched.
- `src/data/mockData.js`: the old separate `rawFlashDeals` /
  `recommendedProducts` arrays are now derived from **one shared `products`
  catalog** (same ids, same fields the homepage already used, plus new
  detail fields: `gallery`, `vendor`, `description`, `specs`, `stock`,
  `reviewCount`, `category`). `flashDeals` and `recommendedProducts` are
  now `products.filter(...)`, not separate hand-written lists — so a
  product is defined once and reused everywhere, per your "don't build a
  separate hardcoded product system" instruction.
  Added: `vendorRegistry`, `getProductById()`, `getRelatedProducts()`,
  `getReviews()`, `buyerProtectionFeatures`.

### Files created

- `src/pages/ProductDetailPage.jsx` — desktop layout (header, breadcrumbs,
  gallery + purchase panel, tabs/reviews/related, delivery/buyer-protection/
  vendor sidebar) and mobile layout (own structure, fixed purchase bar)
- `src/components/Breadcrumbs.jsx`
- `src/components/ImageGallery.jsx` (main image + clickable thumbnails, active state)
- `src/components/QuantitySelector.jsx` (+ / − stepper, clamped to stock)
- `src/components/VendorCard.jsx` (public storefront info only — no private
  customer/vendor data, consistent with the PowerBase privacy principle)
- `src/components/ProductInfoTabs.jsx` (Description / Specifications tabs)
- `src/components/ReviewsSection.jsx` (average, star breakdown, reviews list)
- `src/components/BuyerProtectionSection.jsx`
- `src/components/DeliveryInfo.jsx`
- `src/components/MobilePurchaseBar.jsx` (fixed wishlist / Add to Cart / Buy Now)
- `src/components/Toast.jsx` (lightweight confirmation feedback)

### Files modified

- `src/main.jsx` — added `BrowserRouter`
- `src/App.jsx` — added `Routes`/`Route` for `/` and `/product/:productId`
- `src/components/ProductCard.jsx` — `<a>` → router `Link` (visuals unchanged)
- `src/data/mockData.js` — catalog restructuring described above (additive;
  no existing export was removed or renamed)

### A deliberate mobile layout decision

The spec asked for a fixed mobile purchase bar *and* said the existing
bottom navigation shouldn't conflict with it. Two fixed bottom bars
stacked on a small screen would fight for space, so on the product detail
page the bottom **tab** navigation is not rendered — the purchase bar
takes that slot instead, matching how most marketplace apps handle a
product page. `BottomNav` itself wasn't touched and still appears
everywhere else (currently just the homepage).

### Functionality: real vs. UI-only

- Real: image gallery selection, quantity stepper (clamped to stock),
  tab switching, wishlist toggle (component state), breadcrumb/related
  product navigation, loading and "product not found" states.
- UI-only (by your instruction not to start Cart/Checkout yet): **Add to
  Cart** and **Buy Now** show a confirmation toast but don't write to a
  real cart — there isn't one yet. Wishlist is local component state, not
  persisted. These are the seams to wire up when the Cart phase starts.

### Build/test — same limitation as Phase 1

This sandbox still has no network access, so I could not run
`npm install`, `npm run dev`, or `npm run build` here. I did:
- `node --check` on all plain-JS logic
- a scripted bracket-balance pass across every `.js`/`.jsx` file
- a manual read-through of every new file and every edited import

But the real build has not been executed. Please run:

```bash
npm install
npm run dev
npm run build
```

and send me any errors — I'll fix them before you commit.

### Remaining work

- Wire Add to Cart / Buy Now to a real cart once that phase starts
- Persist wishlist state
- Replace placeholder gallery images (currently the same image repeated 3×
  per product, since only one image per mock product exists) with real
  multi-angle product photography
- Connect `getProductById`/`getRelatedProducts`/`getReviews` to a real API

---

## Phase 3 — Global Cart System + Cart Page

### Plan followed

Inspected the project first: no router-level cart state existed — `Header`,
`MobileHeader`, and `BottomNav` all took a `cartCount` prop that each page
computed locally from mock data (`HomePage` from `getCart()`,
`ProductDetailPage` from the same mock `getCart()`). There was no shared
cart, so Add to Cart on the product page couldn't affect the homepage badge.
That's what this phase replaces.

### Files created

- `src/context/CartContext.jsx` — the global cart: React Context + reducer,
  localStorage persistence, `useCart()` hook, `groupItemsByVendor()`, and
  `computeCartSummary()`
- `src/pages/CartPage.jsx` — `/cart` route, desktop + mobile layouts, empty state
- `src/components/CartVendorGroup.jsx` — one vendor's items, visually separated
- `src/components/CartLineItem.jsx` — shared product row (image, price, qty, remove, stock)
- `src/components/OrderSummary.jsx` — desktop sidebar summary panel
- `src/components/MobileCartSummaryBar.jsx` — sticky bottom checkout bar (mobile)
- `src/components/EmptyCart.jsx`

### Files modified

- `src/main.jsx` — wrapped the app in `CartProvider`
- `src/App.jsx` — added the `/cart` route
- `src/components/Header.jsx`, `MobileHeader.jsx`, `BottomNav.jsx` — now read
  cart count from `useCart()` directly instead of a `cartCount` prop; cart
  icons now use router `Link` instead of `<a>`
- `src/components/CartPanel.jsx` (homepage right panel) — now reads the real
  cart via `useCart()`/`computeCartSummary()` instead of a mock `items` prop.
  One small change beyond the brief: its "Checkout" button now points to
  `/cart` instead of the never-built `/checkout`, since `/cart` is the
  furthest a click can usefully go right now.
- `src/pages/HomePage.jsx` — removed local cart state/`getCart()` call;
  `Header`/`MobileHeader`/`BottomNav`/`CartPanel` now get cart data from
  context, not props
- `src/pages/ProductDetailPage.jsx` — Add to Cart now calls the real
  `addItem(product, quantity)`; Buy Now adds the item then navigates to
  `/cart`; removed the old mock `getCart()` cartCount plumbing
- `src/components/ProductCard.jsx` — already used router `Link` from Phase 2, unchanged here
- `src/data/mockData.js` — removed the mock `cartItems` array,
  `getCart()`, and `computeCartTotals()` (superseded by the real cart);
  everything else in that file is untouched

### Cart functionality implemented

Add / remove / increment / decrement, quantity clamped to `[1, stockQuantity]`,
merges quantity if the same product is added twice, `totalCount` and
`subtotal` computed from live state, `clearCart()` (not yet wired to a UI
button — no natural place for it until Checkout exists), `isInCart()` helper.

### Multi-vendor cart support

Cart items carry `vendor: { id, name }`. `groupItemsByVendor()` buckets the
flat item list by vendor for display — the Cart Page renders one
`CartVendorGroup` per vendor, each with its own subtotal, but it's still a
single flat cart underneath and a single "Proceed to Checkout" for the whole
order (not split into per-vendor checkouts), per your instruction.

### LocalStorage persistence

Cart state is mirrored to `localStorage` under `powerbase_cart_v1` on every
change, and loaded back on startup. Loading is wrapped in try/catch and
validates each item has the expected shape (`productId`, `price`,
`quantity`, `vendor.id`) before accepting it — malformed or corrupted
storage falls back to an empty cart instead of crashing. Swapping this for
a backend-persisted cart later only means changing `loadPersistedCart`/
`persistCart` inside `CartContext.jsx` — nothing else in the app touches
storage directly.

### Existing functionality preserved

Homepage and Product Details render exactly as before; only their cart
plumbing changed from local/mock state to shared context. No visual design
changed on either page.

### Build/test — same limitation as before

Still no network access in this sandbox, so `npm install`/`npm run build`
could not be run here. I did a full bracket-balance scan and import/export
cross-check across every file after each edit and fixed what it caught, but
the real build hasn't executed. Please run:

```bash
npm install
npm run dev
npm run build
```

Manually worth checking once running: add the same product twice (quantities
should merge), push quantity to the stock limit (the stepper should stop and
show "Maximum available stock reached"), add products from two different
mock vendors and confirm the Cart Page shows two separate vendor groups,
and refresh the page to confirm the cart survives.

### Remaining work

- Checkout page (`/cart`'s "Proceed to Checkout" currently navigates to an
  unbuilt `/checkout` route — intentionally, per your scope instruction)
- `clearCart()` exists in the context but has no UI trigger yet
- Swap `localStorage` for backend cart persistence for authenticated users
- Real product photography (still placeholder SVGs from Phase 1/2)
- Wishlist is still local-only (from Phase 2), not part of this phase's scope

---

## Phase 4 — Manual Delivery-Fee Model

### What this phase was and wasn't

You asked for the delivery *flow* to be updated before Checkout gets built —
not for Checkout itself. So this phase touches the Cart Page's fee display,
adds the GH₵7 platform fee config, and prepares (but doesn't yet use) the
delivery-details and order-status data shapes. No Checkout UI was built.

### Delivery logic removed

From `computeCartSummary()` in `CartContext.jsx`:
- The flat `GH₵20` delivery fee
- The `subtotal >= 200 → free delivery` threshold
- The `total` field that quietly included that guessed delivery fee

Nowhere in the app displays a delivery fee amount anymore. Every delivery
fee line now reads **"To be confirmed"** / **"Calculated after order
review"** instead.

### Delivery structure added

- `src/config/pricing.js` — `PLATFORM_FEE_GHS = 7`, the *only* place that
  number is written. Everything else imports it.
- `src/constants/orderStatus.js` — the full `ORDER_STATUS` enum you listed
  (`PENDING` → … → `DELIVERED`/`CANCELLED`), plus human-readable labels.
  Nothing sets these yet — there's no order object in the app — this is
  just the shared vocabulary ready for when Checkout creates one.
- `src/constants/notifications.js` — `NOTIFICATION_CHANNEL` (EMAIL,
  WHATSAPP, SMS, IN_APP) and `buildDeliveryFeeQuotedMessage()`, which only
  formats the text of your example message — it doesn't send anything.
- `src/data/deliveryDetails.js` — `createEmptyDeliveryDetails()` (the shape
  a future Checkout form would collect into: name, phone, email, and a
  `location` object with `method`, `latitude`, `longitude`, `address`,
  `city`, `area`, `landmark`, plus `deliveryInstructions`), and
  `getVendorSafeDeliveryInfo()`, which strips everything down to just
  `city`/`area` — the privacy boundary you described, enforced in code even
  though nothing calls it yet.

### GH₵7 platform fee — how it's configured

`computeCartSummary(items)` in `CartContext.jsx` imports `PLATFORM_FEE_GHS`
from `src/config/pricing.js` and applies it whenever the cart isn't empty.
To change the fee (or later swap it for a backend-fetched value), edit that
one constant — no component or other file hardcodes `7` anywhere.

### Files modified

- `src/context/CartContext.jsx` — `computeCartSummary()` rewritten (see
  above); now returns `{ subtotal, platformFee, deliveryFeeStatus,
  amountDueNow }` instead of `{ subtotal, deliveryFee, total }`
- `src/components/OrderSummary.jsx` — shows Product Subtotal / Platform Fee
  / Delivery Fee ("To be confirmed") / **Amount Due Now**; added the
  professional delivery notice; added a `hideButton` prop so it can be
  embedded without a duplicate "Proceed to Checkout" button
- `src/components/MobileCartSummaryBar.jsx` — sticky bar now shows "Amount
  Due Now" (`amountDueNow`) instead of a `total` that included a guessed fee
- `src/components/CartPanel.jsx` (homepage right panel) — updated to the
  same field names; would have thrown at runtime otherwise, since it still
  destructured the now-removed `deliveryFee`/`total` fields
- `src/pages/CartPage.jsx` — mobile layout now also renders the full
  `OrderSummary` breakdown inline (above the sticky bar), not just the
  compact total, so the delivery-pending explanation is visible on mobile
  too, not only in the sticky strip

### Files created

`src/config/pricing.js`, `src/constants/orderStatus.js`,
`src/constants/notifications.js`, `src/data/deliveryDetails.js`,
`src/components/DeliveryFeeNotice.jsx`

### Existing functionality preserved

Homepage, Product Details, global cart add/remove/quantity logic,
localStorage persistence, and multi-vendor grouping are all unchanged —
only the fee *display* and *math* changed, not cart mechanics.

### Build/test — same limitation as every prior phase

No network access in this sandbox, so `npm install`/`npm run build` still
couldn't be run here. I did the full bracket-balance sweep and an explicit
grep for every old field name (`deliveryFee`, `summary.total`) across the
whole codebase to make sure nothing was left reading a field that no longer
exists — that's exactly the kind of bug (`CartPanel.jsx`) this sweep caught
and fixed before you'd have hit it in the browser. Please still run:

```bash
npm install
npm run dev
npm run build
```

Worth checking once running: cart with items shows "To be confirmed" for
delivery everywhere (homepage panel, cart page desktop, cart page mobile,
sticky bar), and the GH₵7 platform fee appears once items are in the cart
and disappears (shows GH₵0.00) on an empty cart.

### Remaining work

- The Checkout page itself (next phase, per your framing of this task)
- Wiring `createEmptyDeliveryDetails()` into an actual delivery-details form
- Wiring `ORDER_STATUS` into a real order object once orders exist
- Real notification sending (this phase only built the message template)
- Enforcing the vendor-safe delivery info boundary at a backend/API level,
  as you noted it must eventually be — `getVendorSafeDeliveryInfo()` is the
  frontend half only

---

## Between Phase 4 and Phase 5 — corrections + Checkout (not documented by me)

The project uploaded for Phase 5 already included: the three Phase-4
corrections (`DeliveryInfo.jsx` no longer shows a guessed fee, the homepage
promo card now reads "Doorstep Delivery", and `CartContext`'s stock
clamping no longer falls back to 99 for out-of-stock items), plus a full
Checkout page (`CheckoutPage.jsx`, `src/components/checkout/*`,
`src/utils/validation.js`), order creation and localStorage persistence
(`src/data/orderStorage.js`), and an Order Success page — all built and
working. That work happened outside this conversation, so I'm not the
right source for its own file-by-file notes; from here on this file only
documents what I build.

---

## Phase 5 — Order Tracking Module

### Plan followed

Inspected the uploaded project first: routes were `/`, `/product/:id`,
`/cart`, `/checkout`, `/order-success/:orderNumber`; `orderStorage.js`
already had `createOrder`/`saveOrder`/`getOrderByNumber` and an
`ORDER_STATUS` enum; `Header`'s "Track Order" link and `BottomNav`'s
"Orders" link already pointed at `/orders/track` and `/orders` — both
routes just didn't exist yet (blank page). This phase builds those routes
and the order-tracking UI on top of what was already there, without
touching Homepage, Product Details, Cart, or Checkout.

### Routes added

- `/orders` — Order History ("My Orders")
- `/orders/track` — manual order-number lookup
- `/orders/:orderNumber` — Order Details / Tracking

React Router v6 ranks a static path segment above a dynamic one
automatically, so `/orders/track` always resolves to the lookup page
regardless of where it's declared relative to `/orders/:orderNumber` — both
are declared in `App.jsx` with a comment explaining this, per your explicit
concern about route conflicts.

### Files created

- `src/pages/OrderHistoryPage.jsx`, `OrderTrackingLookupPage.jsx`, `OrderDetailsPage.jsx`
- `src/components/orders/OrderStatusBadge.jsx` — colored status pill
- `src/components/orders/OrderStatusTimeline.jsx` — the 9-step visual
  progress timeline (completed / current / upcoming), plus a distinct
  cancelled-order treatment
- `src/components/orders/OrderVendorGroup.jsx` — read-only per-vendor order
  items (no quantity controls — the order's already placed)
- `src/components/orders/OrderFinancialSummary.jsx` — Subtotal / Platform
  Fee / Delivery Fee / Amount Due Now, reading from...
- `src/utils/orderFinancials.js` — the modular `computeOrderFinancials()`
  math, shared by the Order Details page and the Order History cards
- `src/components/orders/OrderDeliveryInfo.jsx` — city/area/landmark/
  instructions only (see Privacy Architecture below)
- `src/components/orders/OrderActivity.jsx` — renders `order.events`, or
  nothing if there are none — never fabricates events
- `src/components/orders/OrderActions.jsx` — status-dependent buttons (see
  Order Tracking Functionality below)
- `src/components/orders/EmptyOrderHistory.jsx`, `OrderNotFound.jsx`, `OrderHistoryCard.jsx`

### Files modified

- `src/App.jsx` — added the three routes above
- `src/constants/orderStatus.js` — `ORDER_STATUS_LABEL` rewritten to your
  exact customer-facing wording ("Delivery Location Under Review", etc.);
  added `ORDER_STATUS_DESCRIPTION` (per-status explanation) and
  `ORDER_TIMELINE_STEPS` (the 9-step ordering, plus the always-complete
  `ORDER_PLACED` checkpoint)
- `src/data/orderStorage.js` — `createOrder()` now also sets
  `deliveryFee: null`, `deliveryFeeQuotedAt: null`, `deliveryFeeNotes: null`,
  and seeds an `events` array (Order Placed / Delivery Location Submitted /
  Delivery Fee Awaiting Review); added `updateOrder()`, `addOrderEvent()`,
  and `lookupOrder()` (trims + case-normalizes user input, separate from the
  exact-match `getOrderByNumber()`); `getOrders()` now sorts newest-first;
  order-number generation now checks for collisions against existing
  storage before accepting one
- `src/pages/OrderSuccessPage.jsx` — "Track Order" now links to
  `/orders/${order.orderNumber}` (the order that was just placed) instead
  of the generic lookup page

### Order Tracking functionality

Lookup by order number (trimmed, case-insensitive, matched only against
this browser's localStorage — clearly commented as the seam a real
backend/API lookup replaces later). Order Details shows: status badge,
9-step timeline reflecting the order's actual status, per-status
description, activity history, items grouped by vendor, financial summary,
customer-safe delivery info, and status-dependent actions:
- `DELIVERY_FEE_PENDING` → Contact Support, Continue Shopping
- `DELIVERY_FEE_QUOTED` → "Review Delivery Fee" (present but inert — no
  real flow exists yet, and no order can currently reach this status), Continue Shopping
- `DELIVERED` → **Buy Again** (functional — re-looks-up each product by id
  via `getProductById`, so it uses current price/stock rather than the
  order's snapshot, adds to cart, navigates to `/cart`), Continue Shopping
- `CANCELLED` → Continue Shopping only
- any other status → Continue Shopping (no action was specified for these
  in your brief, so nothing was invented)

### Order History functionality

`/orders` lists every locally stored order, newest first, each card showing
order number, date, item/vendor counts, Amount Due Now, delivery fee status
("Pending Confirmation" vs. an actual amount), current status, and a View
Order button. Empty state matches your spec (icon, message, Continue
Shopping → `/`).

### Order Status / Timeline functionality

`ORDER_TIMELINE_STEPS` is the single ordered list every timeline render
walks — no component hardcodes step order or labels. For the current
`DELIVERY_FEE_PENDING` status, the timeline shows Order Placed as complete,
Delivery Location Under Review as current, and everything after as
upcoming — matching your example. Cancelled orders render as a standalone
red state instead of a position on the linear timeline.

### LocalStorage handling

Built on the existing `orderStorage.js` persistence (unchanged pattern —
fails safe to `[]` on corrupted data). Newest-first sorting and
collision-checked order numbers were added in this phase; nothing about the
storage mechanism itself changed.

### Privacy architecture

`OrderDeliveryInfo.jsx` (customer's own order details page) intentionally
displays only city, area, landmark, and instructions — not the raw street
address or GPS coordinates, even though this is the customer's own data,
per your "be careful with exact address and GPS coordinates" note. Vendor
order data continues to come only from `groupItemsByVendor()`'s output
(vendor id/name, items, subtotal) — nothing in this phase adds a path for
vendors to receive `order.delivery` or `order.customer` directly. The
existing comment block in `orderStorage.js` and `getVendorSafeDeliveryInfo()`
in `deliveryDetails.js` remain the documented boundary; this phase didn't
need to change either. Real authorization (customers only seeing their own
orders, vendors only seeing vendor-safe data) still needs to be enforced at
a backend/API level once one exists — nothing here pretends otherwise.

### Existing functionality preserved

Homepage, Product Details, Cart, Checkout, and Order Success are
unchanged, aside from the one intentional fix to Order Success's "Track
Order" link.

### Build/test

Still no network access in this sandbox, so `npm install`/`npm run build`
couldn't be run here. Full bracket-balance scan and an explicit
import-by-import cross-check across every file in the project (68 files)
came back clean. Please run:

```bash
npm install
npm run dev
npm run build
```

Worth checking once running: place an order, click "Track Order" on the
success page and confirm it lands on `/orders/:orderNumber` (not the
lookup page); visit `/orders` and confirm the order appears; visit
`/orders/track`, enter the order number, confirm it navigates correctly;
try an invalid order number and confirm the inline error; visit a
nonexistent `/orders/PB-FAKE-0000` directly and confirm "Order Not Found"
renders (not a crash); confirm the timeline shows step 1 complete and step
2 current for a freshly placed order; test on mobile width.

### Remaining work

- No status beyond `DELIVERY_FEE_PENDING` is currently reachable — that's
  expected until an Admin surface exists to call `updateOrder()`; the
  `DELIVERY_FEE_QUOTED`/later states are visually prepared but untestable
  end-to-end until then
- `addOrderEvent()` is prepared but has no caller yet — same reason
- Real backend-enforced order authorization (currently anyone with an order
  number stored in *this* browser can view it — there's no concept of
  "logged in as this customer" yet)
- "Review Delivery Fee" and payment flow for `DELIVERY_FEE_QUOTED` orders
- Real notification delivery when a delivery fee is confirmed

---

## Phase 6 — Customer Account & Profile

### Plan followed

Inspected the project first: `Header`'s account chip already linked to
`/account` (route didn't exist — blank page) using static `currentUser`
mock data; `BottomNav`'s "Account" tab already linked to `/account` too;
no account/profile/address/notification state existed anywhere. This phase
builds the frontend-first account system the spec asked for, wires it into
the existing Header/MobileHeader/BottomNav, and integrates lightly with
Checkout — without touching Homepage, Product Details, Cart, or the Order
Tracking module's own pages.

### Routes added

- `/account` — Account Dashboard
- `/account/profile` — Profile
- `/account/addresses` — Saved Addresses
- `/account/orders` — redirects to the existing `/orders` (see below)
- `/account/notifications` — Notification Center
- `/account/settings` — Settings

### Files created

- `src/data/accountModels.js` — `createEmptyProfile()`, `createEmptyAddress()`,
  `createDefaultSettings()`, `createDefaultAccountState()`, `generateAccountId()`
- `src/context/AccountContext.jsx` — the centralized account state: React
  Context + reducer + localStorage persistence (key `powerbase_account_v1`),
  `useAccount()` hook exposing `profile`, `addresses`, `defaultAddress`,
  `settings`, `notifications`, `unreadNotificationCount`, and every action
  listed in the spec (`updateProfile`, `addAddress`, `updateAddress`,
  `deleteAddress`, `setDefaultAddress`, `markNotificationRead`,
  `markAllNotificationsRead`, `updateSettings`), plus an internal
  `addNotification` used only from real events (order placement) — never to
  generate fake notifications
- `src/components/account/AccountLayout.jsx` — shared chrome for all six
  account pages (Header/MobileHeader/BottomNav + desktop sidebar +
  breadcrumbs + mobile back-bar), the same "one shared layout" approach as
  the Order pages use individually
- `src/components/account/AccountNav.jsx` — desktop sidebar nav (also
  exports `ACCOUNT_NAV_ITEMS`, reused by the mobile menu list)
- `src/components/account/AccountWelcomeSection.jsx` — "Hello, {name} 👋"
  dashboard greeting
- `src/components/account/AccountSummaryCard.jsx` — dashboard stat card
- `src/components/account/AccountQuickActions.jsx` — the four quick-action
  links (View My Orders, Track an Order, Edit Profile, Manage Addresses)
- `src/components/account/AccountMobileMenuList.jsx` — mobile-only section
  list shown on the dashboard (desktop already has the sidebar)
- `src/components/account/ProfileForm.jsx` — editable Full Name / Email /
  Phone form, styled to match `checkout/CustomerInfoForm.jsx`, reusing the
  same `FormField`/`inputClass` and `validateFullName`/`validateEmail`/
  `validatePhone` validators
- `src/components/account/AddressCard.jsx`, `AddressFormPanel.jsx`,
  `EmptyAddresses.jsx` — Saved Addresses list/add/edit/delete/set-default
- `src/components/account/NotificationItem.jsx`, `EmptyNotifications.jsx`
- `src/components/account/SettingsToggle.jsx` — accessible toggle switch
- `src/pages/AccountDashboardPage.jsx`, `AccountProfilePage.jsx`,
  `AccountAddressesPage.jsx`, `AccountOrdersPage.jsx`,
  `AccountNotificationsPage.jsx`, `AccountSettingsPage.jsx`

### Files modified

- `src/main.jsx` — wrapped the app in `AccountProvider` (outside
  `CartProvider`, since Checkout now reads account data)
- `src/App.jsx` — added the six `/account*` routes
- `src/components/Icon.jsx` — added `settings`, `edit`, `trash`, `plus`
  icons (additive; nothing existing changed)
- `src/constants/notifications.js` — added `NOTIFICATION_TYPE`/
  `NOTIFICATION_TYPE_LABEL` and `buildOrderReceivedMessage()`; existing
  `NOTIFICATION_CHANNEL`/`buildDeliveryFeeQuotedMessage` untouched
- `src/components/Header.jsx` — account chip now shows the real profile
  name (falling back to the existing `currentUser` mock if no profile is
  saved yet) and links to `/account` via router `Link` instead of `<a>`;
  the notification bell now links to `/account/notifications` and shows
  the real unread count from `useAccount()` instead of the old
  `notificationCount` prop
- `src/components/MobileHeader.jsx` — same bell change as `Header.jsx`
- `src/pages/CheckoutPage.jsx` — the form's initial state now prefills
  Full Name/Email/Phone from the saved profile and the address fields from
  the default saved address, *only* as the form's starting values (the
  customer can still edit everything, and nothing is silently overwritten
  afterwards); a small "Prefilled from your saved profile/address" note
  shows when this happened. On successful order placement, it now also
  calls `addNotification()` with the exact "Your order {orderNumber} has
  been received." message from the spec — a real event, not a fabricated
  one.

### A note on the old `notificationCount` prop

Every other page (Cart, Product Details, Order pages, Home) still passes a
hardcoded `notificationCount={3}` (or similar) to `Header`/`MobileHeader`.
Those props are no longer read — both components now compute the real
unread count from `AccountContext` internally — so the badge is accurate
everywhere without touching every page's call site. The unused props are
harmless (React ignores unknown props) and the build is clean; a future
cleanup pass can remove them from each page at leisure.

### Customer Account functionality

Dashboard shows a welcome section, three real stat cards (Total Orders,
Orders Awaiting Delivery Fee, Saved Addresses — all computed from
`getOrders()`/`useAccount()`, nothing invented), quick actions, and (mobile
only) a section list; desktop gets a persistent sidebar via `AccountNav`
on every account page.

### Profile functionality

Full Name / Email / Phone, validated with the same validators Checkout
already uses, saved via `updateProfile()`. First save sets `id`/`createdAt`;
every save updates `updatedAt`. No profile photo upload (per spec) — shows
an initials avatar and a "coming soon" note instead of a fake uploader.

### Saved Address functionality

Add/Edit/Delete/Set Default, label presets (Home/Work/Other) plus free
text, required fields (label, full address, city, area) with optional
landmark/instructions and optional (currently unused) lat/lng fields on the
model. Exactly one address can be default — enforced in the reducer, not
just the UI: adding the first address auto-defaults it; setting a new
default clears the old one; deleting the default address leaves *no*
default rather than inventing one.

### Notification functionality

Real, event-driven only: a notification is created when an order is placed
(the order-received message), matching the spec's example exactly. Nothing
generates random/fake notifications. Read/unread state, mark-as-read,
mark-all-as-read, and a proper empty state are all implemented per spec.
`NOTIFICATION_TYPE` vocabulary (order/delivery-fee/payment/delivery/
announcement) is ready for future real channels to use.

### Settings functionality

Frontend-only toggles (Email Notifications, Order Updates, Marketing/
Promotional Messages), persisted via `updateSettings()`. No password/login
UI was built (none exists to change yet) — instead there's a plain
"Account Security" note explaining that's coming once real authentication
exists, per the spec's explicit instruction not to fake that.

### Checkout integration

`CheckoutPage` prefills from the saved profile/default address on initial
load only, never overwrites afterwards, and the customer can edit every
field exactly as before — the checkout components themselves
(`CustomerInfoForm`, `DeliveryAddressForm`, validation) are unchanged.

### Order integration

Account Dashboard and the `/account/orders` route both defer to the
already-built `getOrders()`/`/orders` — no order UI was duplicated.
`/account/orders` is a plain redirect to `/orders`.

### LocalStorage handling

Single key, `powerbase_account_v1`, storing `{ profile, addresses,
settings, notifications }` together (matching the CartContext/orderStorage
pattern already in the project). Loading is wrapped in try/catch and
validates each of the four fields independently, so a corrupted/partial
value in one field falls back to its default instead of discarding the
whole account.

### Privacy architecture

Saved addresses (including the unused-for-now lat/lng fields) are only
ever read by the customer's own Account pages and, on Checkout, folded
into the same `order.delivery`/`order.customer` structure `orderStorage.js`
already documents as "PowerBase/Admin view only." No new code path sends
profile, address, or GPS data to a vendor-facing surface — `groupItemsByVendor()`
/ `getVendorSafeDeliveryInfo()` remain the only vendor-facing boundary, and
this phase didn't need to touch either. As before, this is only the
frontend half of that boundary — real authorization still needs enforcing
at a backend/API level once one exists.

### Existing functionality preserved

Homepage, Product Details, Cart, global cart logic, Checkout's own
form/validation behavior, Order Success, Order History, Order Tracking
Lookup, and Order Details all render exactly as before. The only visible
change to previously-shipped pages: the Header/MobileHeader notification
badge now reflects real unread notifications instead of a hardcoded `3`,
and the account chip shows the real profile name once one is saved.

### Build/test results

This sandbox had network access this time. Ran the real thing:

```
npm install    →  added 133 packages, clean
npm run build  →  ✓ 121 modules transformed, built in 3.80s, no errors/warnings
```

Also ran a bracket-balance sweep across all 89 `.js`/`.jsx` files (0
mismatches) before the build, and a manual import/export cross-check while
writing each file.

Worth checking once running locally: visit `/account` with no prior
activity (dashboard shows all-zero stats and empty nav, no crash); place an
order via Checkout, then revisit `/account` (Total Orders / Orders
Awaiting Delivery Fee update, and a real "Order Update" notification
appears with an unread dot + badge on the bell); add/edit/delete/set-default
a saved address and confirm only one is ever marked default; refresh the
page after each of the above and confirm everything persisted; start a
second Checkout after saving a profile + default address and confirm the
form is prefilled but still editable; open dev tools and corrupt
`localStorage.powerbase_account_v1` with invalid JSON, then refresh — the
account should fail safe to empty rather than crashing; test both desktop
(sidebar nav) and mobile (back-bar + bottom nav) widths on all six pages.

### Remaining work

- Profile photo upload (intentionally not built yet, per spec)
- Real authentication, so `AccountContext`'s localStorage-per-device model
  can be replaced with per-user backend profiles (the context's shape and
  every consumer's `useAccount()` calls are written so only the
  persistence layer needs to change, same pattern as `CartContext`)
- Wiring the unused `notificationCount` props on other pages to read from
  `AccountContext` directly instead of relying on `Header`/`MobileHeader`
  ignoring them (cosmetic cleanup only — not a functional bug)
- Real push/email/WhatsApp/SMS notification delivery (only the in-app
  center + message-building exists, per spec)
- Enforcing the vendor/PowerBase privacy boundary at a backend/API level
