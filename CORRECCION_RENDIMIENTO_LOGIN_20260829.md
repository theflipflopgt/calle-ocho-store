# Corrección de rendimiento y login — 29/08/2026

## Problema encontrado

- El proxy consultaba Supabase en todas las rutas públicas, incluso `/` y
  `/auth/login`.
- El layout raíz validaba la sesión en el servidor antes de mostrar cualquier
  página.
- La portada forzaba renderizado dinámico y encabezados `no-store`.
- El carrusel ejecutaba `router.refresh()` al montarse y provocaba una segunda
  solicitud completa.
- Las tarjetas de producto no declaraban tamaños responsivos para sus imágenes.

Cuando Supabase presentaba latencia, estas decisiones hacían que toda la tienda
esperara al servicio de autenticación antes de mostrar contenido.

## Cambios aplicados

- El proxy ahora se ejecuta únicamente en rutas protegidas de administración y
  cuenta.
- La sesión pública se restaura en el navegador mediante `AuthProvider`; las
  rutas protegidas siguen validadas por el proxy.
- Las lecturas públicas usan un cliente anónimo sin cookies ni refresco de
  sesión.
- La portada utiliza revalidación de 60 segundos.
- Se eliminó el encabezado global `no-store` de la portada.
- Se eliminó la recarga duplicada del carrusel.
- Se agregaron tamaños responsivos a imágenes de tarjetas.
- Administración y cuenta permanecen dinámicas y sin caché compartida.

## Verificación realizada

- TypeScript: correcto.
- Pruebas automatizadas: 44 de 44 aprobadas.
- Compilación de producción: código y TypeScript compilados correctamente. La
  generación completa local requiere las variables reales de Supabase que ya
  están configuradas en Vercel.

## Despliegue

Subir estos cambios al repositorio conectado con Vercel. No es necesario
modificar DNS, Cloudflare ni las variables actuales de Supabase.
