# Marketing, Analytics y SEO

## Implementado

- Google Analytics 4 con `G-LG4JR6C1BF`.
- Medición de navegación SPA.
- Eventos GA4 ecommerce: `view_item_list`, `view_item`, `search`, `add_to_cart`, `begin_checkout` y `purchase`.
- Protección contra duplicar `purchase` al recargar la confirmación.
- Google Tag Manager preparado y desactivado hasta definir `NEXT_PUBLIC_GTM_ID`.
- Metadata global, canonical, Open Graph y Twitter Cards.
- Metadata dinámica de producto.
- Product y Breadcrumb JSON-LD.
- Sitemap dinámico para productos y marcas.
- robots.txt con exclusión de áreas privadas y transaccionales.

## Pendiente del propietario

1. Crear un contenedor GTM si se desea y definir `NEXT_PUBLIC_GTM_ID`.
2. Verificar el dominio en Google Search Console.
3. Enviar `https://calleochostore.com/sitemap.xml` en Search Console.

## Validación después del despliegue

- GA4 > Tiempo real: navegar por catálogo, producto, carrito y checkout.
- GA4 > DebugView: confirmar los eventos ecommerce.
- Probar una orden y comprobar que `purchase` aparece una sola vez.
- Abrir `/sitemap.xml` y `/robots.txt`.
- Validar una página de producto con la prueba de resultados enriquecidos de Google.
