# Galeria de producto e integridad de precios

## Resultado

- Cada color requiere entre 1 y 5 imagenes.
- La ficha muestra miniaturas verticales en escritorio y navegacion tactil en telefono.
- La ganancia deseada se guarda como monto GTQ en `products.desired_profit_amount`.
- PostgreSQL recalcula `calculated_sale_price` con la misma formula del panel.
- El checkout continua leyendo el precio real desde PostgreSQL y guarda una copia historica en `order_items`.
- El costo comercial de factura/FEL no se mezcla con `orders.tax_amount`.

## Formula comercial

```text
precio sugerido =
  (costo + ganancia deseada) /
  (1 - comision Neo Link / 100 - costo de facturacion / 100)
```

Ejemplo verificado: costo Q325, ganancia Q100, factura 5 % y Neo Link 7 %
producen Q482.95.

`base_price` sigue siendo el precio publico y el que utiliza el checkout. El precio
calculado es una sugerencia; el boton del administrador permite aplicarlo como
precio publico.

## Migracion

Aplicar `supabase/migrations/20260814010000_product_pricing_and_gallery_integrity.sql`
antes de desplegar el frontend. La migracion:

1. Agrega `desired_profit_amount` sin eliminar la columna anterior.
2. Convierte los productos existentes sin cambiar `base_price`.
3. Recalcula el sugerido desde PostgreSQL en escrituras futuras.
4. Exige entre 1 y 5 imagenes al terminar cada transaccion de color.

## Verificacion previa

Ejecutar antes de la migracion y guardar el resultado como respaldo:

```sql
select
  id,
  sku,
  base_price,
  cost_price,
  invoice_fee_percent,
  neo_link_fee_percent,
  sale_price_markup_percent,
  calculated_sale_price
from public.products
order by sku;
```

Revisar colores fuera del nuevo limite:

```sql
select
  pc.id,
  p.sku,
  pc.color_name,
  count(pci.id) filter (where length(trim(pci.image_url)) > 0) as image_count
from public.product_colors pc
join public.products p on p.id = pc.product_id
left join public.product_color_images pci on pci.product_color_id = pc.id
group by pc.id, p.sku, pc.color_name
having count(pci.id) filter (where length(trim(pci.image_url)) > 0) < 1
  or count(pci.id) filter (where length(trim(pci.image_url)) > 0) > 5
  or bool_or(pci.id is not null and length(trim(pci.image_url)) = 0);
```

Los registros encontrados deben corregirse desde el administrador. La migracion
no elimina imagenes existentes automaticamente.

## Verificacion posterior

Comprobar la formula almacenada:

```sql
select
  sku,
  base_price,
  desired_profit_amount,
  calculated_sale_price,
  round(
    (cost_price + desired_profit_amount)
    / (1 - (invoice_fee_percent + neo_link_fee_percent) / 100),
    2
  ) as expected_price
from public.products
order by updated_at desc
limit 20;
```

Comprobar que pedidos, detalles y pagos coincidan antes de integrar la pasarela:

```sql
select
  o.order_number,
  o.subtotal,
  coalesce(sum(oi.subtotal), 0) as item_subtotal,
  o.shipping_cost,
  o.discount_amount,
  o.total,
  p.amount as payment_amount
from public.orders o
left join public.order_items oi on oi.order_id = o.id
left join public.payments p on p.order_id = o.id
group by o.id, o.order_number, o.subtotal, o.shipping_cost,
  o.discount_amount, o.total, p.amount
order by o.created_at desc
limit 20;
```

El subtotal debe coincidir con los detalles y `payment_amount` con `total`.

## Prueba de despliegue

1. Usar Node.js 22.
2. Ejecutar `npm ci`, `npm run test:run`, `npm run typecheck` y `npm run build`.
3. Aplicar la migracion en un ambiente de prueba o rama de Supabase.
4. Crear un producto con 1 imagen y otro con 5.
5. Confirmar que no se pueda agregar una sexta ni eliminar la unica imagen.
6. Probar cambio de orden, color, carrito y checkout invitado/autenticado.
7. Confirmar en SQL el precio del producto, `order_items.unit_price`, el total y el pago.
8. Crear un Preview de Vercel y revisar logs antes de produccion.

## FEL y pasarela

Este cambio prepara montos consistentes, pero no implementa FEL ni cobros con
tarjeta. La futura integracion debe enviar el `orders.total` confirmado por el
servidor, comparar exactamente el monto autorizado por la pasarela y registrar
el impuesto FEL en `orders.tax_amount` segun la configuracion fiscal aprobada.
Nunca debe usar `invoice_fee_percent` como impuesto ni almacenar PAN o CVV.

## Reversion

La reversion preferida es volver a la version anterior de la aplicacion y dejar
la columna nueva en Supabase. Es aditiva y el codigo anterior sigue funcionando
por compatibilidad. No eliminar la columna ni los triggers en produccion sin
respaldo y sin comprobar primero que ningun producto nuevo depende de ellos.
