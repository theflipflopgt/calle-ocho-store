# Ajuste de logo y gestion de devoluciones

## Logo

El archivo original conserva grandes margenes transparentes. Se creo
`public/logo-header.png` recortado y optimizado, y el encabezado ahora lo muestra
mas ancho y visible sin deformarlo. El logo original no fue reemplazado.

## Cambios y devoluciones

La pantalla anterior buscaba solamente dentro de gestiones existentes. Para
crear una nueva gestion era necesario escribir un pedido exacto sin verificarlo
antes.

El flujo corregido es:

1. Buscar el numero de pedido, con o sin `#`.
2. Confirmar cliente, estado y total.
3. Detectar si ya existe una gestion abierta.
4. Elegir tipo, escribir motivo y crear la gestion.

Las funciones SQL siguen siendo la ruta principal. Si el RPC no esta disponible,
el servidor usa un respaldo directo solamente despues de confirmar que la sesion
tiene rol `admin`. La service role key nunca llega al navegador y RLS permanece
habilitado.

## Supabase

Ejecutar completo:

`supabase/migrations/20260814040000_staff_order_return_access.sql`

La migracion solicita a PostgREST refrescar su cache al finalizar.

## Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)

## Prueba

1. Ingresar como administrador.
2. Abrir `/admin/devoluciones`.
3. Buscar un pedido existente y confirmar los datos mostrados.
4. Crear una gestion y verificar que aparece en el listado inferior.
5. Buscar un pedido inexistente y confirmar el mensaje de error.
6. Intentar reutilizar un pedido con gestion abierta y confirmar que se bloquea.

## Reversion

Desplegar la version anterior restaura la interfaz previa. No se deben eliminar
las funciones SQL ni desactivar RLS. Ninguno de estos cambios modifica pedidos,
pagos, inventario o gestiones existentes.
