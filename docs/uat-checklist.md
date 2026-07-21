# UAT Checklist (Pre-Production)

## Checkout

- [ ] User can complete checkout with valid shipping data.
- [ ] Empty cart redirects away from checkout.
- [ ] Invalid coupon is rejected with clear message.
- [ ] Successful order returns confirmation page with correct order number.

## Inventory and Consistency

- [ ] Stock decreases on successful order creation.
- [ ] Concurrent purchase on low stock blocks second attempt cleanly.
- [ ] Cancelled/refunded order restores stock once.

## Admin Operations

- [ ] Admin can move order through valid status transitions.
- [ ] Invalid transition is blocked with message.
- [ ] Admin notes are persisted and can be updated repeatedly.

## User Account

- [ ] Customer sees order in `/cuenta/pedidos`.
- [ ] Order detail timeline matches real status.

## Reliability / Security

- [ ] Rate limiting returns `429` on abuse patterns.
- [ ] API endpoints reject unauthorized requests.
- [ ] Email failures do not block order creation.
