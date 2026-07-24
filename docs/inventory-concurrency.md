# Control de inventario concurrente

## Regla aplicada

Agregar un producto al carrito no aparta existencias. El stock se asigna al primer checkout que logra crear el pedido dentro de PostgreSQL.

Cuando dos clientes intentan comprar la última unidad al mismo tiempo:

1. Ambas solicitudes llegan al servidor.
2. PostgreSQL bloquea la variante durante la transacción.
3. La primera transacción valida y descuenta la unidad.
4. La segunda transacción vuelve a validar al obtener el bloqueo.
5. Si ya no queda stock, toda la creación del segundo pedido se revierte y recibe `INSUFFICIENT_STOCK`.

No queda un pedido incompleto, no se insertan artículos parcialmente y el stock nunca puede ser negativo.

## Pedidos por transferencia

El proyecto descuenta el stock cuando el pedido es confirmado en checkout, incluso si el pago por transferencia está pendiente. Esto evita aceptar varios pedidos para una misma unidad.

Cuando un administrador cancela o reembolsa un pedido, la función de cambio de estado devuelve las unidades al inventario una sola vez.

## Migración

Ejecutar:

```text
supabase/migrations/20260724130000_inventory_concurrency_hardening.sql
```

La migración:

- conserva los RPC existentes `create_manual_order` y `create_guest_manual_order`;
- agrega bloqueo determinista por `variant_id`;
- hace el descuento con la condición `stock_quantity >= quantity`;
- aborta la transacción si alguna variante ya no tiene suficiente stock;
- agrega una restricción para impedir nuevos valores negativos.

La restricción se crea como `NOT VALID` para no bloquear el despliegue si existen datos históricos negativos. Aun así, PostgreSQL la aplica inmediatamente a todas las inserciones y actualizaciones nuevas.

## Revisión de datos históricos

Antes de validarla completamente, revisar:

```sql
SELECT id, sku, stock_quantity
FROM public.product_variants
WHERE stock_quantity < 0;
```

Si no devuelve filas:

```sql
ALTER TABLE public.product_variants
VALIDATE CONSTRAINT product_variants_stock_quantity_nonnegative;
```

## Prueba manual recomendada

1. Elegir una variante con `stock_quantity = 1`.
2. Abrir dos sesiones o navegadores distintos.
3. Agregar la misma variante en ambos.
4. Confirmar ambos checkouts casi simultáneamente.
5. Verificar que solo uno genere pedido.
6. El otro debe mostrar el mensaje de stock insuficiente.
7. Confirmar que el stock final sea `0`, nunca `-1`.
