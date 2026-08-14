# Seguimiento de pedidos por vendedor

## Resultado

- Cada pedido conserva el vendedor actual en `orders.seller_id`.
- `orders.seller_assigned_at` registra cuando el vendedor se hizo cargo.
- `order_seller_assignments` conserva asignaciones y reasignaciones.
- El vendedor ve numero de pedido, fecha asignada, cliente, pares, total y estado.
- Administracion ve los cinco pedidos recientes dentro de cada vendedor.
- La tabla general de ordenes muestra vendedor y fecha de asignacion.
- El detalle del pedido muestra el historial de asignacion.

## Migracion

Aplicar antes del frontend:

```text
supabase/migrations/20260814020000_seller_order_tracking.sql
```

La migracion es aditiva. Para pedidos ya asignados usa `orders.created_at` como
fecha inicial, porque antes no existia una fecha de asignacion separada.

## Verificacion posterior

```sql
select
  o.order_number,
  p.full_name as seller,
  o.created_at,
  o.seller_assigned_at,
  o.status,
  o.total
from public.orders o
left join public.profiles p on p.id = o.seller_id
where o.seller_id is not null
order by o.seller_assigned_at desc
limit 20;
```

```sql
select
  o.order_number,
  osa.assignment_source,
  previous.full_name as previous_seller,
  current_seller.full_name as current_seller,
  actor.full_name as assigned_by,
  osa.assigned_at
from public.order_seller_assignments osa
join public.orders o on o.id = osa.order_id
left join public.profiles previous on previous.id = osa.previous_seller_id
left join public.profiles current_seller on current_seller.id = osa.seller_id
left join public.profiles actor on actor.id = osa.assigned_by
order by osa.assigned_at desc
limit 20;
```

## Seguridad

RLS permite que administracion consulte todo el historial. Cada vendedor solo
puede consultar asignaciones cuyo `seller_id` sea su propio usuario. Las politicas
existentes de ordenes siguen impidiendo que vea pedidos asignados a otro vendedor.

## Metricas

- Pendientes: aparecen como trabajo asignado, pero no suman ventas ni comision.
- Pagados, procesando, enviados y entregados: suman ventas, pares y comision.
- Cancelados y reembolsados: no suman metricas.

## Reversion

La aplicacion anterior puede desplegarse sin eliminar las columnas ni la tabla
nueva. No borrar el historial en produccion; es informacion operativa y de
auditoria que puede seguir siendo util aunque se revierta la interfaz.
