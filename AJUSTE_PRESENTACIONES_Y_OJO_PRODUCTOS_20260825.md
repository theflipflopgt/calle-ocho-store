# Ajuste de presentaciones heredadas y vista de producto

Fecha: 2026-08-25

## Cambios

- El editor oculta las presentaciones heredadas que ya estaban marcadas como no disponibles.
- Cuando un producto conserva más de una presentación, cada bloque ofrece la acción `Quitar presentación`.
- La acción solicita confirmación y muestra la existencia que pasará a cero.
- Al guardar, la presentación se marca como no disponible y sus variantes se desactivan mediante `admin_save_product`.
- Los pedidos anteriores no se eliminan ni se modifican.
- Los errores de Supabase que incluyen un campo `message` ya no se muestran como `[object Object]`.
- El botón para ver el producto usa un icono oscuro con nombre accesible y tooltip.
- Los logos de la página principal conservan sus colores y fondos originales, igual que en la página de marcas.

## Archivos modificados

- `app/admin/productos/product-form.tsx`
- `components/products/product-card.tsx`
- `components/home/brands-grid.tsx`

## Prueba local

1. Usar Node.js 22, ejecutar `npm ci` y luego `npm run dev`.
2. Abrir un producto con dos presentaciones heredadas.
3. En `Imágenes y Tallas`, pulsar `Quitar presentación` en la que no se necesita.
4. Confirmar el aviso, guardar y volver a abrir el producto.
5. Verificar que solo aparezca la presentación conservada y que el producto público no muestre la retirada.
6. En una tarjeta de producto, colocar el cursor sobre la imagen y confirmar que el icono del ojo sea visible y abra el detalle.
7. Ejecutar `npm run typecheck`, `npm run lint`, `npm run test:run` y `npm run build` antes del despliegue.

## Despliegue

Crear primero un despliegue Preview en Vercel. Validar el retiro de una presentación de prueba y las tarjetas de producto en escritorio y teléfono antes de promoverlo a producción. Este cambio no requiere variables de entorno nuevas ni una migración SQL.

## Reversión

Revertir los dos archivos de código indicados. Si una presentación fue retirada por error, deberá reactivarse de forma controlada en Supabase junto con las variantes y existencias correctas; no se debe restaurar inventario sin verificar físicamente las unidades.
