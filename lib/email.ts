import { Resend } from 'resend';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import NewOrderNotificationEmail from '@/emails/new-order-notification';
import OrderShippedEmail from '@/emails/order-shipped';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'Calle Ocho Store <pedidos@calleochostore.com>';

const orderStatusLabels: Record<string, string> = {
  pending: 'pendiente',
  paid: 'pagado',
  processing: 'en preparación',
  shipped: 'enviado',
  delivered: 'entregado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
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
      from: emailFrom,
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

    const businessEmail = process.env.BUSINESS_EMAIL || 'ventas@calleochostore.com';

    const { data, error } = await resend.emails.send({
      from: emailFrom,
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
    const emailHtml = await render(
      OrderShippedEmail({
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber,
        estimatedDelivery: params.estimatedDelivery,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailFrom,
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
    if (params.status === 'shipped') {
      return sendOrderShippedEmail({
        to: params.to,
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber || undefined,
      });
    }

    const statusLabel = orderStatusLabels[params.status] || params.status;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calleochostore.com';
    const orderUrl = `${siteUrl}/cuenta/pedidos`;
    const trackingLink = params.trackingUrl
      ? `<p style="margin: 16px 0;"><a href="${params.trackingUrl}" style="color: #2563eb;">Ver seguimiento del envío</a></p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
        <h1 style="font-size: 24px; margin-bottom: 12px;">Actualización de tu pedido</h1>
        <p>Hola ${params.customerName},</p>
        <p>Tu pedido <strong>${params.orderNumber}</strong> ahora esta <strong>${statusLabel}</strong>.</p>
        ${params.trackingNumber ? `<p>Número de guía: <strong>${params.trackingNumber}</strong></p>` : ''}
        ${trackingLink}
        <p style="margin: 24px 0;">
          <a href="${orderUrl}" style="background: #111827; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Ver mis pedidos
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Gracias por comprar en Calle Ocho Store.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: params.to,
      subject: `Tu pedido ${params.orderNumber} esta ${statusLabel} - Calle Ocho Store`,
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
