# Estabilización de sesión y tokens

Cambios aplicados:

- La sesión inicial se lee en el servidor y se entrega al navegador desde el primer render.
- El proxy renueva los tokens con `getClaims()` y copia las cookies renovadas a la solicitud y respuesta.
- El navegador utiliza un único cliente Supabase.
- Se eliminó la recarga agresiva de sesión al enfocar cada pestaña.
- Un fallo temporal de red ya no elimina al usuario ni oculta el menú de perfil.
- `onAuthStateChange` se mantiene síncrono y procesa `SIGNED_OUT` y sesiones renovadas.
- El cierre de sesión ya no elimina manualmente refresh tokens del almacenamiento.
- Las rutas de Admin continúan validando el rol en el servidor.

## Pruebas recomendadas

1. Iniciar sesión y navegar por 10 páginas.
2. Abrir la tienda en otra pestaña desde Admin.
3. Dejar una pestaña abierta más de una hora y volver.
4. Refrescar en `/cuenta`, `/wishlist`, `/carrito` y `/admin`.
5. Cerrar sesión desde la tienda y desde Admin.
6. Confirmar que un cliente no puede entrar a `/admin`.
