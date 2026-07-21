import { Resend } from 'resend';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import NewOrderNotificationEmail from '@/emails/new-order-notification';
import OrderShippedEmail from '@/emails/order-shipped';
import OrderStatusUpdateEmail from '@/emails/order-status-update';
import type { OrderStatus } from '@/types/order-workflow';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'Calle Ocho Store <pedidos@calleochostore.com>';

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

interface SendOrderStatusUpdateParams {
  to: string;
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

const statusSubject: Record<OrderStatus, string> = {
  pending: 'Tu pedido está pendiente',
  paid: 'Pago confirmado',
  processing: 'Estamos preparando tu pedido',
  shipped: 'Tu pedido va en camino',
  delivered: 'Pedido entregado',
  cancelled: 'Pedido cancelado',
  refunded: 'Reembolso actualizado',
};

export async function sendOrderStatusUpdateEmail(params: SendOrderStatusUpdateParams) {
  try {
    const emailHtml = await render(
      OrderStatusUpdateEmail({
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        status: params.status,
        trackingNumber: params.trackingNumber,
        trackingUrl: params.trackingUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: params.to,
      subject: `${statusSubject[params.status]} - Pedido ${params.orderNumber} - Calle Ocho Store`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending order status update email:', error);
      throw error;
    }

    console.log('Order status update email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order status update email:', error);
    return { success: false, error };
  }
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
