# Redeploy incluido: Ofertas desde Productos

Este proyecto ya incluye el cambio para enviar productos a la seccion Ofertas desde:

`/admin/productos`

## Cambio aplicado

- Nuevo boton de porcentaje / Ofertas en cada producto.
- Modal para colocar:
  - Precio anterior.
  - Nuevo precio.
- Guarda el precio anterior en `compare_at_price`.
- Guarda el nuevo precio en `base_price`.
- El producto aparece automaticamente en `/ofertas`.
- Permite quitar una oferta.
- Permitido solo para roles `admin` y `warehouse`.

## Archivos modificados/agregados

- `app/admin/productos/page.tsx`
- `app/admin/productos/offer-button.tsx`
- `app/api/admin/products/[id]/offer/route.ts`

## Variables nuevas

No requiere variables nuevas.

## Prueba despues del deploy

1. Entra al panel admin.
2. Ve a Productos.
3. Presiona el boton de porcentaje / Ofertas.
4. Ingresa precio anterior y nuevo precio.
5. Guarda.
6. Revisa que el producto aparezca en `/ofertas`.
