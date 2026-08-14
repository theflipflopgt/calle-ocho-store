# Operaciones administrativas: inventario, ventas, envíos, devoluciones y auditoría

## Resultado

- Inventario muestra un producto por bloque y agrupa dentro sus colores y tallas.
- Inventario puede descargarse como Excel desde `Administración > Productos > Inventario`.
- Ventas se exporta por fecha inicial, fecha final y estado desde `Administración > Órdenes`.
- Si no se seleccionan fechas, el Excel de ventas incluye el mes actual hasta hoy.
- Envíos muestra pedidos pagados o en proceso que todavía no tienen guía, además del historial de envíos.
- Devoluciones permite abrir una gestión manual por número de pedido y buscar por pedido o cliente.
- Cada devolución muestra el total del pedido y la referencia de pago/transacción disponible.
- Auditoría registra cambios realizados por personal en las áreas operativas, sin copiar valores completos.

## Supabase

Ejecutar en `SQL Editor` el contenido completo de:

`supabase/migrations/20260814030000_staff_activity_audit.sql`

La migración:

1. Crea `admin_activity_logs` y sus índices.
2. Activa RLS y permite que únicamente administradores consulten el historial.
3. Registra inserciones, actualizaciones y eliminaciones hechas por `admin`, `seller` y `warehouse`.
4. Protege las solicitudes de devolución para que el cliente no pueda aprobarlas o resolverlas.
5. Incluye una función manual de limpieza con retención mínima de 90 días.

Consulta de verificación después de ejecutar la migración:

```sql
select
  to_regclass('public.admin_activity_logs') as audit_table,
  count(*) as audit_rows
from public.admin_activity_logs;
```

El resultado esperado de `audit_table` es `admin_activity_logs`. Es normal que `audit_rows` sea cero hasta que un usuario interno realice un cambio.

## Prueba local

Usar Node.js 22, que es la versión declarada por el proyecto.

```bash
npm install
npm run typecheck
npm run test:run
npm run build
npm run dev
```

Validar manualmente:

1. Descargar el inventario y confirmar producto, color, tallas US/EU, SKU y stock.
2. En Órdenes seleccionar un período corto y descargar `Excel del período`.
3. Abrir Envíos y comprobar que un pedido pagado sin guía aparece en `Pedidos por preparar`.
4. Crear una devolución manual con un número de pedido válido y verificar su pago asociado.
5. Cambiar el estado de una gestión y confirmar que aparece en Auditoría.
6. Ingresar como vendedor o bodega y confirmar que no pueden abrir `/admin/auditoria`.

## Seguridad y alcance

- El Excel recalcula su selección desde Supabase; no toma montos editables del navegador.
- La auditoría guarda nombres de campos cambiados, no los datos completos de clientes.
- No se registra cada consulta o navegación, por lo que el volumen permanece controlado.
- La retención recomendada es de 365 días.
- El cambio de talla todavía no mueve inventario automáticamente. Primero debe existir una operación atómica que seleccione variante devuelta, variante nueva, cantidad y confirme la recepción física.
- La pantalla muestra la referencia de la transacción, pero no ejecuta reembolsos en una pasarela todavía.

## Despliegue

1. Ejecutar primero la migración en Supabase.
2. Subir el código a una rama de prueba.
3. Crear un Preview Deployment en Vercel.
4. Probar los cinco flujos anteriores con cuentas `admin`, `seller` y `warehouse`.
5. Revisar logs de compilación y funciones antes de promover a producción.

No se agregaron variables de entorno nuevas.

## Reversión

La interfaz puede revertirse desplegando la versión anterior. Para retirar únicamente la auditoría de base de datos, después de respaldar su contenido:

```sql
drop trigger if exists trg_audit_staff_products on public.products;
drop trigger if exists trg_audit_staff_product_variants on public.product_variants;
drop trigger if exists trg_audit_staff_inventory_movements on public.inventory_movements;
drop trigger if exists trg_audit_staff_orders on public.orders;
drop trigger if exists trg_audit_staff_shipments on public.shipments;
drop trigger if exists trg_audit_staff_return_requests on public.return_requests;
drop trigger if exists trg_audit_staff_seller_commission_rules on public.seller_commission_rules;
drop function if exists public.purge_admin_activity_logs(integer);
drop function if exists public.audit_staff_mutation();
drop table if exists public.admin_activity_logs;
```

No revertir las políticas de devolución a la política anterior `FOR ALL`, porque permitía que un cliente modificara campos administrativos de su propia solicitud.
