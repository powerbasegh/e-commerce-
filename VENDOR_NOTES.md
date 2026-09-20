# PowerBase — Vendor Completion & Hardening Notes

Companion to `PROJECT_NOTES.md`. Covers the vendor hardening pass only.

## Business rule this pass enforces

PowerBase is the customer-facing retailer. Vendors are internal supply
partners. Customers never see vendor identity, contact details, ratings,
settlement amounts, PowerBase margin, or the internal vendor-order split.
All communication is Customer → PowerBase → Vendor and back.

A vendor sees their own price and their own gross share. They never see
`powerbase_margin`, another vendor's anything, or the customer's identity.

## Schema changes (migration 004)

`004_stock_reservations_sku_payout.sql`. Additive only — adds columns and
indexes, never drops or retypes an existing column, never deletes data.
Every statement is `IF NOT EXISTS` or idempotent, so it is safe to re-run.

| Table | Column | Purpose |
|---|---|---|
| `products` | `reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0` | Units held for unpaid orders |
| `products` | `sku VARCHAR(64) NULL` | Vendor stock code, unique per vendor |
| `order_items` | `stock_state ENUM('RESERVED','COMMITTED','RELEASED')` | Per-line reservation state |
| `vendors` | `payout_method`, `payout_account_name`, `payout_account_number`, `payout_bank_name` | Where settlements are paid |

Indexes added: `uq_products_vendor_sku` (unique), `idx_products_vendor_active`,
`idx_products_vendor_created`, `idx_order_items_stock_state`.

### Backfill behaviour

`order_items.stock_state` is added with `DEFAULT 'COMMITTED'`, then altered to
`DEFAULT 'RESERVED'`. Every pre-existing row therefore lands on `COMMITTED`,
which is what is actually true of it — under the old behaviour its stock was
permanently deducted at checkout. Rows created from here on default to
`RESERVED`. No `UPDATE` ever rewrites live rows, which is what makes the
migration safe to re-run.

Run order: `schema.sql`, then `001`, `002`, `003`, `004`.

## Stock lifecycle

Sellable stock is `stock_quantity - reserved_quantity`.

```
order created              -> reserveItems()   reserved += qty
payment confirmed PAID     -> commitItems()    stock -= qty, reserved -= qty
payment FAILED / CANCELLED -> releaseItems()   reserved -= qty
cancelled pre-fulfilment   -> releaseItems()   reserved -= qty
```

Physical stock only moves once PowerBase has been paid. Before this pass,
`createOrder` decremented `stock_quantity` immediately, so an abandoned or
failed checkout silently destroyed a vendor's inventory and never returned it.

`commitItems` / `releaseItems` only act on rows still in `RESERVED`, so a
replayed payment webhook cannot double-deduct.

Implemented in `server/src/services/stockService.js`.

## Order status relationship

`orders.status` is customer-facing and owned by PowerBase.
`vendor_orders.status` is internal per-vendor fulfilment state.

A vendor writes only their own `vendor_orders` row. `deriveOrderStatus()`
then recomputes the customer order from the full set of vendor orders, in the
same transaction, so the two cannot drift.

Derivation, from `CONFIRMED` / `PROCESSING` / `READY_FOR_DELIVERY` only:

- no vendor orders left active → `CANCELLED` (releases stock, voids settlements)
- all active vendor orders `READY_FOR_DELIVERY` → `READY_FOR_DELIVERY`
- any active vendor order `PROCESSING` or beyond → `PROCESSING`
- otherwise → `CONFIRMED`

`OUT_FOR_DELIVERY`, `DELIVERED` and `CANCELLED` are never overwritten by a
vendor action.

### Vendor transitions

```
PENDING            -> PROCESSING | CANCELLED
PROCESSING         -> READY_FOR_DELIVERY
READY_FOR_DELIVERY -> (nothing)
```

`OUT_FOR_DELIVERY` and `DELIVERED` are deliberately absent. PowerBase runs the
last mile, and `DELIVERED` is the gate on settlement payout — a vendor able to
set it could unlock their own payout.

Three server-side gates run on every vendor transition:

1. payment on the order must be `PAID`
2. the customer order must be in a vendor-actionable state
3. the transition must be legal from the current state

## Settlement rules

```
order created      -> settlement PENDING
payment PAID       -> settlement ELIGIBLE (eligible_at stamped)
order DELIVERED
  + admin payout   -> settlement PAID (payout reference required)
payment failed /
order cancelled    -> settlement CANCELLED
```

A vendor cannot reach any settlement mutation — those endpoints are ADMIN-only
and the vendor role is rejected at the router. Cancelled settlements are
excluded from a vendor's lifetime earnings total (they remain visible in the
per-status breakdown).

## Authorization model

`requireActiveVendor` (`middleware/auth.js`) is the single place a vendor
identity is established. It resolves `req.vendor` from the JWT
(`req.user.id` → `vendors.user_id`) and re-checks live account state on every
request, so admin deactivation takes effect immediately rather than when the
token expires.

Every vendor query is scoped `WHERE vendor_id = req.vendor.id`. A `vendor_id`,
product id or order id supplied by the client can never reach another vendor's
rows — it only fails to match, and returns 404 rather than 403 so the endpoint
does not confirm that another vendor's id exists.

`updateProfile` writes an explicit column allow-list. `verified`, `is_active`,
`default_share_percent`, `rating`, `id` and the user's `role` are absent by
design.

## Admin endpoints added

Backend only — no admin UI in this pass. Added because nothing in the system
could previously set `payments.status='PAID'` or move an order to `DELIVERED`,
which left the entire settlement chain unreachable.

```
GET    /api/admin/orders/all
GET    /api/admin/orders/:orderId
PUT    /api/admin/orders/:orderId/payment     { status, provider, transactionReference }
PATCH  /api/admin/orders/:orderId/status      { status }
```

`PUT .../payment` is the only path to `PAID` anywhere in the system. It is not
reachable from a customer or vendor session, and no frontend "payment success"
page can trigger it. A real provider webhook should eventually call the same
transaction body.

## Product images

Still URL-only. There is no upload pipeline, and none is faked. `imageUrl` is
now validated server-side (`normalizeImageUrl`): site-relative paths and
`http(s)` URLs only, which keeps `javascript:` and `data:` URLs out of
customer-facing product pages.

When a real Cloudinary/S3 upload endpoint is added it should write into the
same `products.image_url` column, so nothing downstream needs to change.

## Reservation expiry

An order created but never paid for would otherwise hold its reservation
forever, quietly removing sellable units from a vendor's inventory.

`services/reservationService.js` sweeps these back. It only touches orders
that are genuinely still awaiting payment: payment row `PENDING`, order in a
pre-confirmation state, and older than the window. A confirmed payment is
never reversed — once stock is `COMMITTED`, `releaseItems()` finds nothing in
`RESERVED` and does nothing, so even a mistimed sweep cannot claw back stock
from a paid order. Each order is swept in its own transaction and re-checked
under a lock, so a customer who pays mid-sweep is not cancelled.

An expired order is cancelled, its vendor orders and settlements cancelled,
and the customer notified.

```
RESERVATION_EXPIRY_HOURS=48      # how long stock may be held (default 48)
RESERVATION_SWEEP_MINUTES=30     # sweep interval; 0 disables
```

The sweeper starts in `server.js`, not `app.js`, so importing the app (as the
test suite does) does not spawn a background timer. It can also be run on
demand: `POST /api/admin/reservations/expire` (admin only).

If the backend is ever scaled past one Render instance this should move to a
scheduled job — the per-order locking makes concurrent sweeps safe, but it is
wasted work.

## Product image upload

Real Cloudinary integration in `services/imageService.js`, configured entirely
through environment variables. The file is posted to PowerBase, PowerBase
uploads it, and only the resulting secure URL returns. Credentials never reach
the browser. Uploads are filed per vendor using the id from the authenticated
session. Images are capped at 1200x1200 and 5MB, JPEG/PNG/WebP only, held in
memory and streamed straight to Cloudinary — nothing is written to disk.

If the environment variables are absent the feature reports itself unavailable
and the endpoint returns 503. It does not silently pretend to work. The vendor
UI calls `GET /api/vendor/uploads/status` and only renders the upload control
when the server can honour it; pasting an image URL still works either way, as
before.

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=powerbase/products
```

Set all three of the first, restart, and the upload control appears.

## Tests

`server/tests/run.sh` boots a scratch database, applies the schema and every
migration in order, re-applies them to prove idempotency, then runs
`server/tests/vendor.integration.test.js` — the real Express app over real
HTTP with real JWTs, no mocks.

```
cd server && bash tests/run.sh
```

56 tests covering ownership isolation, privilege escalation, the stock
lifecycle, payment gating, transition rules, settlement integrity, margin and
customer-identity leakage, customer-side regression, reservation expiry, and upload gating.
