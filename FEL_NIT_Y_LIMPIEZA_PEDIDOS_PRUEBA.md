# Preparación FEL: NIT y limpieza de pedidos de prueba

## NIT
- El checkout ahora permite capturar `NIT para factura` de forma opcional.
- Acepta `CF` o un NIT con dígitos y guion/verificador.
- Se guarda en `orders.billing_nit` como fotografía del dato usado para facturación.
- El detalle de la orden en Admin muestra el NIT.
- Aún no se emite FEL ni se integra un certificador.

## Base de datos
Ejecutar primero `supabase/migrations/20260815010000_billing_nit_fel_readiness.sql`.

## Pedidos de prueba
`supabase/manual/20260815_delete_all_test_orders.sql` es un script manual y destructivo. Solo debe ejecutarse mientras se confirme que todos los pedidos existentes son de prueba. Antes de borrar, restaura el inventario de pedidos que todavía no lo habían liberado.
