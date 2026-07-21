# Sistema de Emails - Calle Ocho Store

Este directorio contiene las plantillas de email del sistema usando **Resend** y **React Email**.

## 📧 Plantillas Disponibles

### 1. `order-confirmation.tsx`
Email de confirmación de pedido enviado al cliente cuando completa una compra.

**Cuándo se envía:** Automáticamente al crear un pedido en `/checkout`

**Incluye:**
- Detalles del pedido (número, fecha)
- Lista de productos con imágenes
- Totales (subtotal, envío, descuento)
- Dirección de envío
- Botón para ver el pedido en la cuenta

### 2. `new-order-notification.tsx`
Notificación enviada al negocio cuando se recibe un nuevo pedido.

**Cuándo se envía:** Automáticamente al crear un pedido en `/checkout`

**Incluye:**
- Información del cliente
- Lista completa de productos
- Totales
- Dirección de envío
- Notas del cliente (si las hay)
- Botón al panel de administración

### 3. `order-shipped.tsx`
Email enviado al cliente cuando su pedido es marcado como enviado.

**Cuándo se envía:** Manualmente desde el panel de admin al actualizar el estado del pedido a "shipped"

**Incluye:**
- Número de rastreo (opcional)
- Fecha estimada de entrega (opcional)
- Botón para ver detalles del pedido

## 🚀 Uso

### Envío Automático
Los emails de confirmación se envían automáticamente cuando:
- Un cliente completa una compra en `/checkout`
- Se crea exitosamente el pedido en la base de datos

### Envío Manual (Para admin)
Para enviar el email de "pedido enviado", usa la función desde el panel de admin:

```typescript
import { sendOrderShippedEmail } from '@/lib/email';

await sendOrderShippedEmail({
  to: 'cliente@example.com',
  customerName: 'Juan Pérez',
  orderNumber: 'TFF-123ABC',
  trackingNumber: '1234567890', // Opcional
  estimatedDelivery: 'Viernes 14 de Febrero', // Opcional
});
```

## 🔧 Configuración

Las variables de entorno necesarias están en `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
BUSINESS_EMAIL=ventas@calleochostore.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📝 Personalización

Para modificar las plantillas:

1. Edita los archivos `.tsx` en este directorio
2. Los estilos están inline usando objetos de JavaScript
3. Usa los componentes de `@react-email/components`
4. Prueba localmente antes de desplegar

## 🔗 Links Útiles

- [Resend Dashboard](https://resend.com/emails)
- [React Email Docs](https://react.email/docs/introduction)
- [Componentes disponibles](https://react.email/docs/components/html)

## 📧 Emails de Prueba

Resend envía todos los emails a direcciones reales, pero en desarrollo puedes usar:
- Tu email personal para probar el flujo completo
- Emails de prueba de Resend si tienes cuenta de pago

## ⚠️ Importante

- Los emails se envían de forma asíncrona y no bloquean la creación del pedido
- Si falla el envío, se registra en los logs pero no afecta la compra
- Para producción, configura un dominio verificado en Resend
- El remitente actual es `onboarding@resend.dev` (dominio de prueba de Resend)

## 🎨 Personalizar Remitente

Para usar tu propio dominio:

1. Verifica tu dominio en Resend
2. Actualiza el campo `from` en `lib/email.ts`:
   ```typescript
   from: 'Calle Ocho Store <pedidos@calleochostore.com>'
   ```
