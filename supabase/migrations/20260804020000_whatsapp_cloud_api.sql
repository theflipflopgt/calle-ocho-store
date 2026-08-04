-- Idempotent audit trail for WhatsApp Cloud API messages and delivery events.

CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event_key TEXT,
  recipient TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'unknown',
  template_name TEXT,
  provider_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'received', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(event_key, recipient)
);

CREATE INDEX IF NOT EXISTS whatsapp_message_logs_recipient_idx
  ON public.whatsapp_message_logs(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_message_logs_status_idx
  ON public.whatsapp_message_logs(status, updated_at DESC);

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.whatsapp_message_logs FROM anon, authenticated;
GRANT ALL ON TABLE public.whatsapp_message_logs TO service_role;

DROP TRIGGER IF EXISTS trg_whatsapp_message_logs_updated_at ON public.whatsapp_message_logs;
CREATE TRIGGER trg_whatsapp_message_logs_updated_at
BEFORE UPDATE ON public.whatsapp_message_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

