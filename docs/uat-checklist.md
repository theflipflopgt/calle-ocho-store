# UAT Checklist (Pre-Production)

## Checkout

- [ ] User can complete checkout with valid shipping data.
- [ ] Empty cart redirects away from checkout.
- [ ] Invalid coupon is rejected with clear message.
- [ ] Successful order returns confirmation page with correct order number.
- [ ] Repeating the same request with the same `Idempotency-Key` returns the same order and does not reduce stock twice.
- [ ] Payment method is already correct when the order RPC finishes.
- [ ] A variant with `price_override` shows and charges the same price in catalog, product, cart, checkout and order.

## Inventory and Consistency

- [ ] Stock decreases on successful order creation.
- [ ] Concurrent purchase on low stock blocks second attempt cleanly.
- [ ] Cancelled/refunded order restores stock once.
- [ ] Pending order expires after 24 hours and the hourly cron restores stock once.
- [ ] Sales, expiration, cancellation, import and manual adjustments create `inventory_movements`.

## Admin Operations

- [ ] Admin can move order through valid status transitions.
- [ ] Invalid transition is blocked with message.
- [ ] Admin notes are persisted and can be updated repeatedly.
- [ ] Product save/archive, inventory import and order adjustment roll back completely when any row fails.
- [ ] Admin can register tracking and move a valid order through shipment states.
- [ ] Customer can open a return request and admin can resolve it.
- [ ] Product staff can upload a signed image/video to Cloudinary.

## Seller Isolation

- [ ] Seller sees only assigned orders, items, payment data, customer profile and shipment.
- [ ] Seller cannot update status, notes, payment link or shipment for an unassigned order.
- [ ] Round-robin assignment reads `seller_commission_rules.commission_percent` and stores the expected commission snapshot.

## User Account

- [ ] Customer sees order in `/cuenta/pedidos`.
- [ ] Order detail timeline matches real status.

## Reliability / Security

- [ ] Rate limiting returns `429` on abuse patterns.
- [ ] API endpoints reject unauthorized requests.
- [ ] Email failures do not block order creation.
- [ ] Replayed checkout does not send duplicate order emails.
- [ ] Newsletter welcome email contains a valid unsubscribe link and the link marks the subscriber unsubscribed.
- [ ] Health endpoint responds and security headers are present.
- [ ] NeoPay remains disabled until the official certified integration is complete.
