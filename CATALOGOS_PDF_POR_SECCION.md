# Catálogos PDF por sección

El panel administrativo ahora permite generar catálogos independientes para:

- Mujer
- Hombre
- Niños
- Ofertas
- Completo

Los enlaces están disponibles en el Dashboard y en Administración > Productos.

La ruta utilizada es:

`/api/admin/exports/catalog?tipo=...`

Valores admitidos: `mujer`, `hombre`, `ninos`, `ofertas`, `completo`.

El catálogo de ofertas incluye el precio anterior y el precio de oferta. Todos los catálogos incluyen únicamente productos activos con al menos una variante disponible y con existencias.
