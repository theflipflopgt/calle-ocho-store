-- Newsletter duplicate hardening.
-- The email column is already UNIQUE; this migration documents that duplicate
-- subscriptions must be treated as idempotent and must not trigger more emails.

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
  ON public.newsletter_subscribers (email);
