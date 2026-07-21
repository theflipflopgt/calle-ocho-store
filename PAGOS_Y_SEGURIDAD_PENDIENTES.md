# Pagos y seguridad: estado de preparación

## Implementado en esta versión

- Se eliminó el bloque duplicado de envío gratis de Hombre, Mujer y Niños.
- El checkout permite seleccionar transferencia bancaria.
- Tarjeta y Visacuotas aparecen como opciones preparadas, pero bloqueadas hasta conectar NeoPay de NeoNet.
- El servidor rechaza cualquier intento de forzar pagos con tarjeta desde el navegador mientras la pasarela no esté configurada.
- Se agregó una migración para referencias del proveedor, idempotencia y auditoría de eventos de pago.
- Se agregaron encabezados HTTP de seguridad.
- El umbral de envío gratis quedó unificado en Q1,000.

## Trabajo manual necesario para NeoPay de NeoNet

Solicitar al banco y configurar únicamente en variables de entorno del servidor:

- comercio/merchant ID;
- terminal o afiliación;
- credenciales de sandbox y producción;
- URL oficial del endpoint o SDK indicado por NeoPay;
- secreto o certificado para validar notificaciones;
- URLs de retorno aprobada, cancelada y webhook.

No colocar credenciales en archivos públicos ni variables `NEXT_PUBLIC_*`.

## Antes de activar tarjeta

1. Confirmar con NeoPay el flujo contratado: formulario hospedado, tokenización o API.
2. Implementar el adaptador del proveedor según la documentación entregada para el comercio.
3. Verificar criptográficamente cada webhook antes de actualizar un pago.
4. Usar `provider_event_id` e `idempotency_key` para impedir cargos o eventos duplicados.
5. Marcar una orden como pagada solo desde confirmación del servidor/webhook, nunca por parámetros de la URL de retorno.
6. Ejecutar la migración `20260721004000_payment_readiness.sql` en Supabase.

La aplicación no debe capturar, guardar ni registrar números completos de tarjeta, CVV o fecha de vencimiento.
