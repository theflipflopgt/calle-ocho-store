-- WhatsApp bubble configuration editable from Admin > Configuracion.
-- Public users may read only the storefront WhatsApp setting; only server-side
-- administrative code writes it with the service role after validating admin.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read storefront whatsapp setting" ON public.site_settings;
CREATE POLICY "Public can read storefront whatsapp setting"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = 'storefront_whatsapp_number');

REVOKE INSERT, UPDATE, DELETE ON public.site_settings FROM anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

INSERT INTO public.site_settings (key, value)
VALUES ('storefront_whatsapp_number', '50252498898')
ON CONFLICT (key) DO NOTHING;
