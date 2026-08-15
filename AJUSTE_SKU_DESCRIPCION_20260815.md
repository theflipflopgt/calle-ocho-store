# Ajuste de SKU, color, tallas y descripción

## Objetivo
Alinear el alta manual y la validación del inventario con la regla comercial de Calle Ocho:

- Un SKU de producto representa un modelo/color específico.
- Las tallas son variantes de inventario de ese mismo SKU.
- Un color diferente debe usar otro SKU de producto.

## Compatibilidad de base de datos
No se eliminó ni renombró ninguna tabla o columna.

Se conserva `product_colors` como capa interna porque actualmente relaciona:

- imágenes del producto;
- variantes/tallas;
- inventario existente;
- pedidos y catálogo público.

Para productos nuevos, el formulario crea una sola presentación interna. El `sku_suffix` continúa existiendo internamente para compatibilidad, pero ya no se solicita al administrador.

Los productos antiguos que tengan más de un color se muestran como estructura heredada y se conservan al guardar; el formulario no los elimina automáticamente.

## Cambios de interfaz
- La pestaña `Colores y Variantes` ahora se llama `Imágenes y Tallas`.
- Se elimina del formulario el campo `Sufijo SKU`.
- Se elimina la acción `Agregar Color` para productos nuevos.
- El SKU principal sigue siendo el código real del producto.
- Las referencias internas de cada talla siguen generándose en segundo plano, pero ya no se muestran como otro SKU al usuario.
- Se aclara que si el mismo modelo llega en otro color con otro SKU, debe crearse como producto separado.

## Inventario masivo
La previsualización de Excel ahora bloquea dos colores diferentes dentro del mismo `codigo_producto`/SKU. También valida el color de un SKU ya existente cuando ese producto tiene una única presentación.

No cambia el esquema de las tablas ni el RPC de importación.

## Descripción automática
Se agregó un botón `Generar descripción` en el formulario de producto.

La generación:

- usa nombre, marca, categoría, color y género;
- solo se ejecuta cuando el administrador la solicita;
- deja el texto editable antes de guardar;
- no inventa materiales ni tecnologías del calzado;
- no requiere una API externa ni una nueva variable de entorno.

La ruta del servidor valida que el usuario tenga permiso para administrar productos.

## Migraciones
Este ajuste no requiere ejecutar una migración SQL.
