import { Resend } from 'resend';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import NewOrderNotificationEmail from '@/emails/new-order-notification';
import OrderShippedEmail from '@/emails/order-shipped';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultEmailFrom = 'Calle Ocho Store <onboarding@resend.dev>';

function getEmailFrom() {
  return process.env.EMAIL_FROM || defaultEmailFrom;
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function isValidEmail(email: string) {
  return email.length <= 254 && emailRegex.test(email);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://calleochostore.com';
}

function emailConfigError() {
  return {
    success: false,
    error: 'RESEND_API_KEY no está configurada en el servidor.',
  };
}

function invalidRecipientError(to: string) {
  return {
    success: false,
    error: `Destinatario inválido: ${to}`,
  };
}

const orderStatusLabels: Record<string, string> = {
  pending: 'pendiente',
  paid: 'pagado',
  processing: 'en preparación',
  shipped: 'enviado',
  delivered: 'entregado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
};

const customerOrderStatusEmailSubjects: Record<string, string> = {
  cancelled: 'Tu pedido fue cancelado',
  refunded: 'Tu pedido fue reembolsado',
};

interface OrderItem {
  product_name: string;
  brand_name: string;
  color_name: string;
  size_us: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_image_url: string | null;
}

interface ShippingAddress {
  recipient_name: string;
  phone: string;
  street_address: string;
  zone?: string | null;
  neighborhood?: string | null;
  city: string;
  department: string;
}

interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shippingAddress: ShippingAddress;
}

interface SendNewOrderNotificationParams {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shippingAddress: ShippingAddress;
  customerNotes?: string | null;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  try {
    if (!isValidEmail(params.to)) {
      return invalidRecipientError(params.to);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    const emailHtml = await render(
      OrderConfirmationEmail({
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        orderDate: params.orderDate,
        items: params.items,
        subtotal: params.subtotal,
        shippingCost: params.shippingCost,
        discount: params.discount,
        total: params.total,
        shippingAddress: {
          recipient_name: params.shippingAddress.recipient_name,
          phone: params.shippingAddress.phone,
          street_address: params.shippingAddress.street_address,
          zone: params.shippingAddress.zone || undefined,
          neighborhood: params.shippingAddress.neighborhood || undefined,
          city: params.shippingAddress.city,
          department: params.shippingAddress.department,
        },
      })
    );

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `Confirmación de Pedido ${params.orderNumber} - Calle Ocho Store`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }

    console.log('Order confirmation email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendNewOrderNotification(params: SendNewOrderNotificationParams) {
  try {
    const businessEmail = process.env.BUSINESS_EMAIL || 'ventas@calleochostore.com';

    if (!isValidEmail(businessEmail)) {
      return invalidRecipientError(businessEmail);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    const emailHtml = await render(
      NewOrderNotificationEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        orderNumber: params.orderNumber,
        orderDate: params.orderDate,
        items: params.items,
        subtotal: params.subtotal,
        shippingCost: params.shippingCost,
        discount: params.discount,
        total: params.total,
        shippingAddress: {
          recipient_name: params.shippingAddress.recipient_name,
          phone: params.shippingAddress.phone,
          street_address: params.shippingAddress.street_address,
          zone: params.shippingAddress.zone || undefined,
          neighborhood: params.shippingAddress.neighborhood || undefined,
          city: params.shippingAddress.city,
          department: params.shippingAddress.department,
        },
        customerNotes: params.customerNotes || undefined,
      })
    );

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: businessEmail,
      subject: `🎉 Nuevo Pedido ${params.orderNumber}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending new order notification:', error);
      throw error;
    }

    console.log('New order notification sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send new order notification:', error);
    return { success: false, error };
  }
}

interface SendOrderShippedParams {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export async function sendOrderShippedEmail(params: SendOrderShippedParams) {
  try {
    if (!isValidEmail(params.to)) {
      return invalidRecipientError(params.to);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    const emailHtml = await render(
      OrderShippedEmail({
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber,
        estimatedDelivery: params.estimatedDelivery,
      })
    );

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `📦 Tu pedido ${params.orderNumber} ha sido enviado - Calle Ocho Store`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending order shipped email:', error);
      throw error;
    }

    console.log('Order shipped email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
    return { success: false, error };
  }
}

interface SendOrderStatusUpdateParams {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export async function sendOrderStatusUpdateEmail(params: SendOrderStatusUpdateParams) {
  try {
    if (!['shipped', 'cancelled', 'refunded'].includes(params.status)) {
      return { success: true, skipped: true };
    }

    if (!isValidEmail(params.to)) {
      return invalidRecipientError(params.to);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    if (params.status === 'shipped') {
      return sendOrderShippedEmail({
        to: params.to,
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber || undefined,
      });
    }

    const statusLabel = orderStatusLabels[params.status] || params.status;
    const headline = customerOrderStatusEmailSubjects[params.status] || 'Actualización de tu pedido';
    const siteUrl = getSiteUrl();
    const orderUrl = `${siteUrl}/seguimiento`;
    const customerName = escapeHtml(params.customerName);
    const orderNumber = escapeHtml(params.orderNumber);
    const safeStatusLabel = escapeHtml(statusLabel);
    const supportUrl = 'https://wa.me/50252498898';

    const html = `
      <div style="background:#f4f6f8; padding:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; color:#111827;">
          <div style="background:#111111; padding:30px 38px; text-align:center;">
            <p style="color:#93c5fd; font-size:12px; font-weight:700; text-transform:uppercase; margin:0 0 10px;">Actualización de pedido</p>
            <h1 style="color:#ffffff; font-size:28px; line-height:34px; margin:0;">${escapeHtml(headline)}</h1>
          </div>
          <div style="padding:32px 40px 12px;">
            <p style="font-size:15px; line-height:24px; margin:0 0 12px; color:#374151;">Hola ${customerName},</p>
            <p style="font-size:15px; line-height:24px; margin:0; color:#374151;">
              Tu pedido <strong>${orderNumber}</strong> ahora está <strong>${safeStatusLabel}</strong>.
            </p>
          </div>
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin:20px 40px 0; padding:20px;">
            <p style="font-size:14px; font-weight:700; margin:0 0 8px; color:#111827;">Qué puedes hacer ahora</p>
            <p style="font-size:14px; line-height:22px; margin:0; color:#4b5563;">
              Si necesitas más información, puedes consultar el seguimiento o escribirnos por WhatsApp con tu número de pedido.
            </p>
          </div>
          <div style="padding:26px 40px 34px; text-align:center;">
            <a href="${escapeHtml(orderUrl)}" style="background:#111111; color:#ffffff; padding:12px 20px; border-radius:8px; display:inline-block; text-decoration:none; font-size:14px; font-weight:700;">
              Consultar seguimiento
            </a>
          </div>
          <div style="background:#111111; padding:24px 40px; text-align:center;">
            <p style="color:#d1d5db; font-size:13px; line-height:20px; margin:0 0 8px;">
              ¿Necesitas ayuda? WhatsApp: <a href="${supportUrl}" style="color:#ffffff;">+502 5249 8898</a>
            </p>
            <p style="color:#9ca3af; font-size:12px; margin:0;">Calle Ocho Store, Guatemala.</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: `${headline}: ${params.orderNumber} - Calle Ocho Store`,
      html,
    });

    if (error) {
      console.error('Error sending order status update email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order status update email:', error);
    return { success: false, error };
  }
}

interface SendNewsletterWelcomeEmailParams {
  to: string;
}

export async function sendNewsletterWelcomeEmail(params: SendNewsletterWelcomeEmailParams) {
  try {
    if (!isValidEmail(params.to)) {
      return invalidRecipientError(params.to);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    const siteUrl = getSiteUrl();
    const html = `
      <div style="background:#f4f6f8; padding:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; color:#111827;">
          <div style="background:#111111; padding:34px 40px; text-align:center;">
            <p style="color:#93c5fd; font-size:12px; font-weight:700; text-transform:uppercase; margin:0 0 10px;">Calle Ocho Store</p>
            <h1 style="color:#ffffff; font-size:30px; line-height:36px; margin:0;">Ya estás en la lista</h1>
          </div>
          <div style="padding:32px 40px 10px;">
            <p style="font-size:15px; line-height:24px; margin:0 0 12px; color:#374151;">Gracias por suscribirte a nuestro boletín.</p>
            <p style="font-size:15px; line-height:24px; margin:0; color:#374151;">
              Te enviaremos novedades, lanzamientos y ofertas de calzado. Cuidaremos tu correo y no lo compartiremos con terceros.
            </p>
          </div>
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin:22px 40px 0; padding:18px 20px;">
            <p style="font-size:14px; font-weight:700; margin:0 0 8px; color:#111827;">Qué recibirás</p>
            <p style="font-size:14px; line-height:22px; margin:0; color:#4b5563;">Avisos de nuevos modelos, ofertas seleccionadas y actualizaciones importantes de la tienda.</p>
          </div>
          <div style="padding:26px 40px 34px; text-align:center;">
            <a href="${escapeHtml(siteUrl)}" style="background:#111111; color:#ffffff; padding:12px 20px; border-radius:8px; display:inline-block; text-decoration:none; font-size:14px; font-weight:700;">
              Ver tienda
            </a>
          </div>
          <div style="background:#111111; padding:22px 40px; text-align:center;">
            <p style="color:#9ca3af; font-size:12px; margin:0;">Calle Ocho Store, Guatemala.</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: 'Bienvenido al boletín de Calle Ocho Store',
      html,
    });

    if (error) {
      console.error('Error sending newsletter welcome email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send newsletter welcome email:', error);
    return { success: false, error };
  }
}

interface SendNewsletterAdminNotificationParams {
  subscriberEmail: string;
  source: string;
}

export async function sendNewsletterAdminNotification(params: SendNewsletterAdminNotificationParams) {
  try {
    const businessEmail = process.env.BUSINESS_EMAIL || 'ventas@calleochostore.com';

    if (!isValidEmail(businessEmail)) {
      return invalidRecipientError(businessEmail);
    }

    const resend = getResendClient();
    if (!resend) {
      return emailConfigError();
    }

    const html = `
      <div style="background:#f4f6f8; padding:24px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; color:#111827;">
          <div style="background:#111111; padding:28px 40px;">
            <p style="color:#93c5fd; font-size:12px; font-weight:700; text-transform:uppercase; margin:0 0 8px;">Boletín</p>
            <h1 style="color:#ffffff; font-size:24px; margin:0;">Nueva suscripción</h1>
          </div>
          <div style="padding:28px 40px;">
            <p style="font-size:14px; line-height:24px; margin:0 0 8px;"><strong>Correo:</strong> ${escapeHtml(params.subscriberEmail)}</p>
            <p style="font-size:14px; line-height:24px; margin:0 0 8px;"><strong>Origen:</strong> ${escapeHtml(params.source)}</p>
            <p style="font-size:14px; line-height:24px; margin:0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-GT')}</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: businessEmail,
      subject: 'Nueva suscripción al boletín - Calle Ocho Store',
      html,
    });

    if (error) {
      console.error('Error sending newsletter admin notification:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send newsletter admin notification:', error);
    return { success: false, error };
  }
}
