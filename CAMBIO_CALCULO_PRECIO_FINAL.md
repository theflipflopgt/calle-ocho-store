# Cambio del calculo de precio final

## Formula

El precio sugerido se calcula con:

```text
(costo + ganancia deseada) / (1 - porcentaje Neo Link / 100 - porcentaje factura / 100)
```

`ganancia deseada` es un monto en quetzales. Los campos de factura y Neo Link
se ingresan como porcentajes completos: por ejemplo, `5` representa 5 %.

La suma de ambos porcentajes debe ser menor al 100 %. El formulario bloquea el
uso del precio sugerido y el guardado si no se cumple esta condicion.

## Archivos

- `lib/pricing/calculate-final-price.ts`: calculo compartido y redondeo a centavos.
- `app/admin/productos/product-form.tsx`: calculadora del formulario de producto.
- `lib/admin/inventory-import.ts`: calculo equivalente para importaciones.
- `tests/unit/calculate-final-price.test.ts`: casos unitarios de la formula.
- `tests/unit/inventory-import.test.ts`: casos de importacion y validacion.

La ganancia se guarda en `desired_profit_amount`. La columna anterior se conserva
temporalmente para compatibilidad y reversion, pero ya no es la fuente principal.

## Prueba local

1. Usar Node.js 22.
2. Ejecutar `npm ci`.
3. Ejecutar `npm run test:run`.
4. Ejecutar `npm run typecheck`.
5. Ejecutar `npm run dev` y abrir un producto en el panel administrativo.
6. Probar costo Q325, ganancia Q100, factura 5 % y Neo Link 7 %.
7. Confirmar que el precio sugerido sea Q482.95.
8. Confirmar que 30 % + 70 % muestre error y deshabilite el boton.

## Despliegue

Crear primero un despliegue Preview en Vercel. Validar la edicion de un producto,
el precio guardado y una importacion de prueba antes de promover a produccion.
Este cambio no requiere variables de entorno. Si la base ya existe, se debe
aplicar `20260814010000_product_pricing_and_gallery_integrity.sql` antes del frontend.

## Reversion

Revertir juntos los archivos indicados arriba. La columna nueva puede permanecer
en Supabase para evitar una eliminacion destructiva y permitir una reversion segura.
