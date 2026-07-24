# Google Analytics 4 - Fase 1

La tienda carga Google Analytics 4 con el ID de medicion `G-LG4JR6C1BF`.

## Implementacion

- La etiqueta se carga una sola vez desde el layout principal.
- Las navegaciones internas de Next.js envian vistas de pagina sin recargar el sitio.
- La variable `NEXT_PUBLIC_GA_MEASUREMENT_ID` puede reemplazar el ID predeterminado.
- Todavia no se envian eventos de ecommerce. Eso corresponde a la fase 2.

## Verificacion

1. Publicar el proyecto.
2. Abrir la tienda en una ventana sin bloqueadores de anuncios.
3. En Google Analytics, abrir **Informes > Tiempo real**.
4. Navegar entre dos o tres paginas de la tienda.
5. Confirmar que aparezca al menos un usuario activo y varias vistas de pagina.

Los bloqueadores de anuncios y algunas protecciones del navegador pueden impedir la medicion durante la prueba.
