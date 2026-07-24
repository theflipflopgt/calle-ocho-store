# Envíos por municipio

## Reglas implementadas

- Ciudad de Guatemala: mensajería propia, Q35.
- Mixco: mensajería propia, Q35.
- Villa Nueva: mensajería propia, Q40.
- Mensajería propia gratis desde Q1,000.
- Los demás municipios y departamentos usan Guatex por cobrar.
- En Guatex, la tarifa no se suma al pedido: el cliente la paga directamente al transportista al recibir el paquete.
- Pago contra entrega solo se muestra para mensajería propia y únicamente si la variable correspondiente está habilitada.
- Para el departamento de Guatemala se muestra un selector con sus municipios; en otros departamentos se conserva un campo de municipio para no bloquear destinos mientras se amplía el catálogo nacional.

## SQL obligatorio

Ejecutar la migración:

`supabase/migrations/20260724210000_delivery_coverage_and_shipping.sql`

Esta migración reemplaza las funciones de checkout para que el total guardado en la base de datos coincida con el cálculo mostrado en pantalla.
