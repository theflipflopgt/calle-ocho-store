# NeoPay: estado de la integración

La tienda quedó preparada para NeoPay/NeoNet, pero **no procesa tarjetas aún**. Esto es deliberado: no se debe inventar el formato de firma, endpoints ni estados de una pasarela financiera.

## Implementado

- Métodos visibles en checkout: transferencia, tarjeta Visa/Mastercard y NeoCuotas.
- Tarjeta y NeoCuotas permanecen bloqueados hasta activar y certificar NeoPay.
- Validación del método tanto en cliente como en servidor y en la función SQL.
- Campos de auditoría para referencia, autorización, marca, últimos 4 dígitos e installments.
- Índices e idempotencia base para pagos.
- Endpoint de estado: `/api/payments/neopay/readiness`.
- Endpoint de webhook cerrado por defecto: `/api/payments/neopay/webhook`.
- No se guarda PAN, fecha de expiración ni CVV.

## Información que debe entregar NeoNet

1. Manual técnico oficial y versión de la API.
2. URL sandbox y URL producción.
3. Merchant ID y Terminal ID.
4. API key/secret o certificados.
5. Formato exacto de creación de sesión/transacción.
6. Método oficial de firma y encabezado del webhook.
7. Lista oficial de estados, códigos de error y reintentos.
8. URL de retorno/cancelación y requisitos 3D Secure.
9. Reglas de NeoCuotas e identificación del número de cuotas.
10. Proceso y casos de certificación.

## Variables preparadas

```env
NEOPAY_ENABLED=false
NEOPAY_ENVIRONMENT=sandbox
NEOPAY_MERCHANT_ID=
NEOPAY_TERMINAL_ID=
NEOPAY_API_URL=
NEOPAY_API_KEY=
NEOPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_NEOPAY_ENABLED=false
```

No cambie `NEOPAY_ENABLED=true` hasta adaptar el código a la documentación oficial y completar la certificación.

## Migración

Ejecutar en Supabase:

`supabase/migrations/20260721005000_neopay_readiness.sql`

## Pendientes al recibir documentación

- Implementar creación de sesión/token en servidor.
- Redirigir o montar campos hospedados de NeoPay.
- Verificar firma oficial del webhook.
- Procesar eventos de forma idempotente.
- Cambiar pedido a `paid` únicamente desde respuesta verificable del servidor/webhook.
- Hacer pruebas de aprobado, rechazado, timeout, duplicado, reverso y devolución.
