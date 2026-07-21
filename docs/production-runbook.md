# Production Runbook (Manual Payments)

## Daily Operations

1. Review new orders in `/admin/ordenes` every 30-60 minutes.
2. Contact customer to confirm manual payment method.
3. Update status flow: `pending -> paid -> processing -> shipped -> delivered`.
4. Add internal notes for each handoff in the order detail.

## Incident Handling

### Order creation failing

1. Check server logs for `orders.create.failed`.
2. Validate Supabase connectivity and RLS/policies.
3. Verify stock integrity in `product_variants`.
4. Retry customer order only after root cause is resolved.

### Email notifications failing

1. Check logs for `orders.create.email_failed` or `send-order-emails.failed`.
2. Verify `RESEND_API_KEY` and sender domain status.
3. Manually notify customer/business and re-send from admin workflow if needed.

### Status updates failing

1. Check logs for `admin.orders.status.failed`.
2. Confirm admin role in `profiles`.
3. Confirm requested transition is valid.
4. Retry via admin panel after correction.

## Rollback

1. Revert API/DB migration commit.
2. Deploy previous stable build.
3. Disable checkout entry points if orders are not safe.
4. Announce temporary maintenance message to support channel.

## Release Gate

- `npm run build` passes.
- `npm run lint` passes.
- `npm run test:run` passes.
- UAT checklist completed.
