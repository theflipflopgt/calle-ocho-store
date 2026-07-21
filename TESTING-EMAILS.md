# 🧪 Guía de Prueba - Sistema de Emails

## ✅ Configuración Completada

El sistema de notificaciones por email está listo con:

- ✉️ **Resend** configurado con tu API key
- 📧 **3 plantillas de email** profesionales en React
- 🚀 **Envío automático** al completar pedidos
- 🎨 **Diseño responsive** compatible con todos los clientes de email

## 📋 Cómo Probar

### 1. Preparar Datos de Prueba

Asegúrate de tener:
- ✅ Usuario registrado y autenticado
- ✅ Productos en el carrito
- ✅ Dirección de envío configurada

### 2. Realizar un Pedido de Prueba

1. Ve a http://localhost:3000
2. Agrega productos al carrito
3. Ve al checkout: http://localhost:3000/checkout
4. Completa la información de envío
5. **IMPORTANTE:** Usa tu email real en la cuenta
6. (Opcional) Aplica un cupón de descuento
7. Revisa el pedido y confirma

### 3. Verificar Emails Enviados

Después de confirmar el pedido, deberías recibir:

**📧 Email 1: Confirmación de Pedido** (a tu email)
- Asunto: "Confirmación de Pedido TFF-XXXXX - Calle Ocho Store"
- Contenido:
  - Lista de productos con imágenes
  - Totales (subtotal, envío, descuento si aplica)
  - Dirección de envío
  - Botón para ver el pedido

**📧 Email 2: Notificación al Negocio** (a ventas@calleochostore.com)
- Asunto: "🎉 Nuevo Pedido TFF-XXXXX"
- Contenido:
  - Información del cliente
  - Lista completa de productos
  - Dirección de envío
  - Notas del cliente (si las hay)

### 4. Ver Logs en Consola

Los logs del servidor mostrarán:
```
Order confirmation email sent: { id: 're_xxx...' }
New order notification sent: { id: 're_xxx...' }
```

## 🔍 Revisar en Resend Dashboard

1. Ve a https://resend.com/emails
2. Inicia sesión con tu cuenta
3. Verás todos los emails enviados con:
   - Estado (delivered, bounced, etc.)
   - Fecha y hora de envío
   - Vista previa del email
   - Métricas de apertura (si está habilitado)

## 🐛 Solución de Problemas

### No llegan los emails

1. **Verifica la consola del servidor:**
   ```bash
   tail -f /tmp/nextjs-dev.log
   ```

2. **Revisa que la API key sea correcta:**
   - Abre `.env.local`
   - Verifica `RESEND_API_KEY=re_REEMPLAZAR_CON_NUEVA_API_KEY`

3. **Chequea el dashboard de Resend:**
   - ¿Aparecen los emails en "Emails" > "Logs"?
   - ¿Cuál es el estado? (delivered, bounced, etc.)

### Error al compilar las plantillas

Si ves errores sobre React Email:
```bash
npm install resend react-email @react-email/components
```

### Emails van a spam

- Esto es normal con el dominio de prueba `onboarding@resend.dev`
- Revisa tu carpeta de spam
- Para producción, configura tu propio dominio verificado

## 🎯 Próximos Pasos (Opcional)

### 1. Configurar Dominio Propio

Para usar `pedidos@calleochostore.com`:

1. Ve a Resend Dashboard > Domains
2. Agrega tu dominio
3. Configura los registros DNS (MX, SPF, DKIM)
4. Actualiza `lib/email.ts`:
   ```typescript
   from: 'Calle Ocho Store <pedidos@calleochostore.com>'
   ```

### 2. Implementar Email de "Pedido Enviado"

Ya está preparada la plantilla `order-shipped.tsx`. Para usarla:

```typescript
// Cuando actualices el estado del pedido a "shipped" en admin:
import { sendOrderShippedEmail } from '@/lib/email';

await sendOrderShippedEmail({
  to: customerEmail,
  customerName: 'Juan Pérez',
  orderNumber: 'TFF-123ABC',
  trackingNumber: '1234567890', // Opcional
  estimatedDelivery: 'Viernes 14 de Febrero', // Opcional
});
```

### 3. Métricas y Analytics

Resend proporciona automáticamente:
- Tasa de apertura
- Tasa de clics
- Bounces y complaints
- Logs detallados

## 📊 Límites del Plan Gratuito

Resend plan gratuito:
- ✅ 100 emails/día
- ✅ 3,000 emails/mes
- ✅ Todos los features
- ✅ Sin tarjeta de crédito requerida

Suficiente para desarrollo y lanzamiento inicial.

## 🎨 Personalizar Plantillas

Las plantillas están en `/emails/`:
- `order-confirmation.tsx` - Confirmación al cliente
- `new-order-notification.tsx` - Notificación al negocio
- `order-shipped.tsx` - Pedido enviado

Para editarlas, simplemente modifica los archivos y reinicia el servidor.

## ✨ ¡Todo Listo!

El sistema de emails está funcionando. Solo necesitas:
1. Hacer un pedido de prueba
2. Revisar tu bandeja de entrada
3. Verificar en el dashboard de Resend

Si tienes problemas, revisa los logs del servidor y el dashboard de Resend.
