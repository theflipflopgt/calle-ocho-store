-- Editable site content for home page sections.

CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read" ON public.site_content
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "site_content_admin_write" ON public.site_content;
CREATE POLICY "site_content_admin_write" ON public.site_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

INSERT INTO public.site_content (key, content)
VALUES (
  'home',
  '{
    "hero": {
      "desktopVideoSrc": "https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445271/video-h_ktgozh.mp4",
      "mobileVideoSrc": "https://res.cloudinary.com/dv5nlnc0r/video/upload/q_auto,f_auto/v1770445093/video-v_yu5vvi.mp4",
      "fallbackImage": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
      "titleLine1": "Descubre tu",
      "titleLine2": "Estilo Unico",
      "subtitle": "Los mejores sneakers de las marcas mas exclusivas",
      "buttonLabel": "COMPRAR AHORA",
      "buttonHref": "/hombre"
    },
    "categories": [
      {
        "title": "HOMBRE",
        "description": "Descubre los ultimos lanzamientos",
        "href": "/hombre",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
        "alt": "Tenis para hombre",
        "overlay": "dark"
      },
      {
        "title": "MUJER",
        "description": "Estilo y comodidad en cada paso",
        "href": "/mujer",
        "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=2070&auto=format&fit=crop",
        "alt": "Tenis para mujer",
        "overlay": "dark"
      },
      {
        "title": "NINOS",
        "description": "Diversion y confort para los mas pequenos",
        "href": "/ninos",
        "image": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=2070&auto=format&fit=crop",
        "alt": "Tenis para ninos",
        "overlay": "dark"
      },
      {
        "title": "OFERTAS",
        "description": "Hasta 50% de descuento",
        "href": "/ofertas",
        "image": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop",
        "alt": "Ofertas especiales",
        "badge": "SALE",
        "overlay": "sale"
      }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
