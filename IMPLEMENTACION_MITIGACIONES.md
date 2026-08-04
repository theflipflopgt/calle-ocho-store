# Mitigaciones de preparación para producción

## Qué se implementó

- Migración baseline para reconstruir el esquema base desde cero.
- Checkout v2 con llave idempotente, método de pago atómico y asignación de vendedor dentro de la transacción.
- Precio efectivo por variante (`price_override`) consistente en catálogo, ficha, favoritos, carrito, checkout, analítica y cobro.
- Aislamiento de vendedores por `seller_id` en RLS y funciones administrativas.
- Expiración automática de pedidos pendientes después de 24 horas y reposición idempotente de stock.
- Bitácora `inventory_movements` para ventas, cancelaciones, expiraciones, importaciones y ajustes.
- Guardado de producto, archivo de producto, importación de inventario y ajuste de pedidos mediante RPC transaccionales.
- Envíos y devoluciones con tablas, APIs y pantallas administrativas.
- Baja firmada del boletín.
- Carga firmada de imágenes y videos a Cloudinary.
- Registro e idempotencia básica de correos mediante `email_logs`.
- Rate limiting persistente en PostgreSQL.
- Health check, CSP, estados globales de carga/error y CI.
- Pruebas adicionales y smoke E2E sin dependencias nuevas.
- Recuperación de roles sin recursión RLS y lectura de identidad no cacheable.
- Instalación npm reproducible aun con el árbol de peer dependencies heredado.
- Base segura de WhatsApp Cloud API con webhook firmado, cliente de plantillas y bitácora idempotente.

## Aplicación de base de datos

No ejecute migraciones directamente en producción sin respaldo.

1. Cree un proyecto Supabase de Preview o use Supabase local.
2. Ejecute `supabase db reset` para confirmar que el baseline y las migraciones posteriores funcionan juntas.
3. Regenerar tipos con `npm run db:types` después del reset.
4. Ejecute `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` y complete `docs/uat-checklist.md`.
5. Tome un respaldo de producción.
6. Ejecute `supabase db push` primero contra Preview y después contra producción.

Las migraciones nuevas son:

- `20260101000000_baseline_schema.sql`: solo crea objetos que no existan; permite instalaciones nuevas.
- `20260803010000_checkout_integrity_and_operations.sql`: integridad de checkout y tablas operativas.
- `20260803020000_atomic_admin_operations.sql`: permisos y operaciones administrativas atómicas.

## Variables nuevas

Solo servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `NEWSLETTER_UNSUBSCRIBE_SECRET`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Públicas:

- `NEXT_PUBLIC_FACEBOOK_URL`
- `NEXT_PUBLIC_INSTAGRAM_URL`

Nunca use prefijo `NEXT_PUBLIC_` para service role, secretos de Cloudinary, Resend, cron o NeoPay.

## WhatsApp Cloud API

Se agregaron `/api/webhooks/whatsapp` para verificación y recepción firmada, `/api/whatsapp/readiness` para comprobar configuración y un cliente de servidor para plantillas aprobadas. La migración `20260804020000_whatsapp_cloud_api.sql` crea `whatsapp_message_logs` y evita duplicados por evento, destinatario e identificador de Meta.

La integración permanece apagada con `WHATSAPP_CLOUD_API_ENABLED=false` hasta configurar las variables privadas en Vercel, registrar el webhook, sustituir el token temporal por uno permanente y aprobar las plantillas transaccionales. Nunca guarde tokens ni `WHATSAPP_APP_SECRET` en el repositorio.

## Cron de pedidos pendientes

`vercel.json` ejecuta `/api/internal/orders/expire` diariamente a las 08:00 UTC (02:00 en Guatemala), frecuencia compatible con Vercel Hobby. Vercel debe tener `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`. Cada pedido pendiente recibe `expires_at` a 24 horas; el cron cancela y restaura inventario una sola vez. Con la frecuencia diaria, la liberacion efectiva puede ocurrir entre 24 y 48 horas despues de crear el pedido. En Vercel Pro puede restaurarse la ejecucion horaria con `0 * * * *`.

## NeoPay

NeoPay continúa apagado. Se conservaron los endpoints de readiness y webhook cerrado. Para activarlo todavía se requiere:

- manual oficial de NeoNet;
- URLs sandbox/producción;
- algoritmo de firma;
- catálogo de eventos y estados;
- flujo 3DS y NeoCuotas;
- pruebas y certificación del comercio.

No cambie `NEOPAY_ENABLED=true` hasta implementar y certificar ese contrato. Neo Link manual continúa disponible como método separado.

## Estado de verificación de esta entrega

Se verificaron los JSON del proyecto, la alineación entre `package.json` y `package-lock.json`, los delimitadores de todas las migraciones y la sintaxis de los 84 archivos `.ts` mediante el analizador nativo de Node.js. También pasaron comprobaciones funcionales directas de validación de pedidos, idempotencia, envío, estados, rate limiting y baja del boletín. El entorno de preparación no permitió descargar paquetes desde npm y no tenía Supabase CLI/PostgreSQL, por lo que el build, ESLint, Vitest y `supabase db reset` continúan como compuertas obligatorias de CI/Preview antes de producción.

## Reversión

El código anterior puede restaurarse con el despliegue estable previo. Las tablas y columnas nuevas deben permanecer durante la reversión para evitar pérdida de datos; no las elimine. Si el checkout v2 presenta problemas, deshabilite temporalmente los accesos al checkout, restaure el despliegue anterior y revise los logs antes de aceptar pedidos nuevos.
