# Importacion archivada y publicacion masiva

## Cambios

- Todo producto NUEVO creado por la carga masiva de inventario queda con `status = archived`, aunque el Excel diga `active`.
- Si el producto ya existe, la importacion conserva su estado actual. Esto evita ocultar productos activos durante una reposicion de stock.
- El inventario, colores, tallas y stock se cargan normalmente mientras el producto queda preparado fuera de la tienda publica.
- En Admin > Productos > Inventario, los administradores pueden seleccionar productos archivados y usar `Publicar seleccionados`.
- Publicar seleccionados solo cambia `products.status` a `active`. No modifica stock, tallas, colores ni imagenes.
- La publicacion masiva esta limitada a 100 productos por solicitud y la funcion SQL valida nuevamente que el usuario sea `admin`.
- Los usuarios con rol `warehouse` pueden seguir preparando/importando inventario, pero no publicar productos.

## Migracion

Ejecutar/desplegar:

`supabase/migrations/20260815050000_safe_inventory_staging_and_bulk_publish.sql`

## Flujo recomendado

1. Importar el Excel.
2. Los productos nuevos quedan archivados.
3. Completar y revisar imagenes, precio, tallas, stock y descripcion.
4. Seleccionar los productos listos en Inventario.
5. Usar `Publicar seleccionados` y confirmar.
