# Revisión: Hero, contacto y confirmación de pedido

## Hallazgos corregidos

- El menú **Hero Carousel** apuntaba a una pantalla antigua que administraba productos destacados, pero la página principal utiliza el Hero configurable de **Admin > Inicio**. Ahora el menú lleva a **Inicio y Hero** y la ruta antigua redirige al editor correcto.
- El WhatsApp empresarial quedó unificado como **+502 5249 8898** (`50252498898` para enlaces).
- El checkout limpiaba el carrito antes de navegar. El efecto de carrito vacío podía devolver al usuario a `/carrito` y ocultar la confirmación. Ahora se marca la orden como creada, se navega primero a `/checkout/confirmacion` y luego se limpia el carrito sin bloquear.
