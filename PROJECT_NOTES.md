# PowerBase Marketplace Project Notes

## Customer-facing business model
PowerBase is presented to customers as the retailer/marketplace brand. Customers do not see individual vendor names, vendor ratings, vendor storefronts, vendor shares, or PowerBase's internal vendor breakdown.

Customers:
- browse products under the PowerBase brand
- add products from multiple internal suppliers to one PowerBase cart
- place one PowerBase order
- pay PowerBase
- receive PowerBase delivery/support

## Internal fulfillment and settlement model
Vendors remain in the database and are used for fulfillment and accounting only.

For each order, the backend creates:
- one `orders` record for the customer-facing PowerBase order
- one `vendor_orders` record per internal vendor
- one `order_items` record per purchased product
- one `payments` record owned by PowerBase
- one `vendor_settlements` record per vendor order

Vendor settlement is calculated server-side from `products.vendor_share_percent` when set, otherwise `vendors.default_share_percent` (seeded at 80%). The remainder of product revenue is PowerBase margin. These values are never returned by customer order APIs.

## Payment rule
The frontend cannot mark an order as paid. A real Paystack/Hubtel/etc. provider integration and server-side webhook verification must update `payments.status` to `PAID`. Until then, payment records remain `PENDING`.

## Settlement rule
A vendor settlement cannot become `ELIGIBLE`, `PROCESSING`, or `PAID` until the related PowerBase payment is `PAID`. It cannot be marked `PAID` until the customer order is `DELIVERED`, and a payout reference is required.

## Delivery
Delivery fees remain separate from vendor settlement. PowerBase/admin manually reviews the delivery location and quotes the delivery fee. The customer-facing total becomes product subtotal + platform fee + quoted delivery fee.

## Database migration
After the existing schema, run:
`server/src/schema/migrations/002_platform_settlements.sql`

It adds vendor share configuration, PowerBase payment records, vendor settlement records, and indexes.

## Deployment
Keep real credentials in Render environment variables only. Never commit `.env` or `server/.env`.

Frontend:
`VITE_API_URL=https://<powerbase-api-render-host>/api`

Backend:
`CLIENT_URL=https://<powerbase-frontend-render-host>` plus the TiDB and JWT variables documented in `server/.env.example`.

## PowerBase Delivery MVP
- Added `/delivery` customer request flow for point-to-point package delivery.
- Added `/admin/delivery-service` for quoting, rider assignment, lifecycle management and delivery analytics.
- Delivery requests are separate from marketplace orders and never expose vendor information.
- Fee quoting is manual in this MVP; no GPS-distance pricing is performed automatically.
- Rider fields are operational assignment data only. A dedicated rider login/tracking app remains a later phase.
- Paystack payment for standalone delivery requests is intentionally not faked; the existing marketplace Paystack flow remains unchanged. Standalone delivery payment should be wired to a dedicated delivery payment record/webhook before accepting production delivery fees.
