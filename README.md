# Calle Ocho Store

Tienda online de tenis con integraciones de IA.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage)
- **Images:** Cloudinary
- **Emails:** Resend + React Email
- **Animations:** Framer Motion
- **AI:** Groq (chatbot)
- **Deploy:** Vercel

## Desarrollo Local

1. Clonar el repositorio
   ```bash
   git clone https://github.com/theflipflopgt/calle-ocho-store.git
   cd calle-ocho-store
   ```

2. Instalar dependencias
   ```bash
   npm install
   ```

3. Configurar variables de entorno
   ```bash
   cp .env.example .env.local
   ```
   Editar `.env.local` con tus credenciales de Supabase.

4. Iniciar servidor de desarrollo
   ```bash
   npm run dev
   ```

5. Abrir [http://localhost:3000](http://localhost:3000)

## Características

✨ **Sistema de Emails Automáticos**
- Confirmación de pedido al cliente
- Notificación de nuevo pedido al negocio
- Email de envío con tracking
- Plantillas profesionales responsive

🔒 **Checkout Server-Side Seguro**
- Creación de órdenes desde API (`/api/orders/create`)
- Validación de stock y cupones en servidor
- Registro automático de pago manual pendiente
- Protección contra manipulación de montos en frontend

🎨 **Animaciones Sutiles**
- Product cards con fade-in al scroll
- Cart drawer animado
- Micro-interacciones en botones
- Optimizado para performance

🛒 **E-commerce Completo**
- Catálogo de productos con filtros
- Sistema de cupones de descuento
- Carrito de compras persistente
- Checkout integrado

🔐 **Autenticación**
- Email/Password
- Google OAuth
- Panel de administración

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Migraciones de Base de Datos

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```
