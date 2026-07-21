import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/utils/currency';
import { ArrowLeft, Package, MapPin, User, CreditCard, Truck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderStatusUpdater } from './status-updater';
import { AdminNotesEditor } from './admin-notes-editor';
import type { OrderStatus } from '@/types/order-workflow';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(id: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:user_id (id, full_name, email, phone),
      order_items (
        id,
        product_name,
        product_sku,
        brand_name,
        color_name,
        size_us,
        unit_price,
        quantity,
        subtotal,
        product_image_url
      ),
      payments (
        id,
        payment_method,
        amount,
        status,
        transaction_id,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    return null;
  }

  return order;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagado', class: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Procesando', class: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Enviado', class: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Entregado', class: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', class: 'bg-gray-100 text-gray-600' },
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  bank_transfer: 'Transferencia bancaria',
  cash_on_delivery: 'Pago contra entrega',
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'text-yellow-600' },
  processing: { label: 'Procesando', className: 'text-blue-600' },
  completed: { label: 'Completado', className: 'text-green-600' },
  failed: { label: 'Fallido', className: 'text-red-600' },
  refunded: { label: 'Reembolsado', className: 'text-gray-600' },
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/ordenes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-black">
                Orden #{order.order_number}
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.class}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              {order.created_at && new Date(order.created_at).toLocaleDateString('es-GT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-brand-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos ({order.order_items?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-brand-black">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.brand_name} • {item.color_name} • Talla {item.size_us}
                    </p>
                    <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-brand-black">
                      {formatPrice(Number(item.unit_price))}
                    </p>
                    <p className="text-sm text-gray-600">x{item.quantity}</p>
                    <p className="text-sm font-medium text-brand-black">
                      {formatPrice(Number(item.subtotal))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Summary */}
            <div className="p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span>{formatPrice(Number(order.shipping_cost))}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>-{formatPrice(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              Dirección de Envío
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shipping_recipient_name}</p>
              <p className="text-gray-600">{order.shipping_phone}</p>
              <p className="text-gray-600">{order.shipping_street_address}</p>
              {order.shipping_zone && (
                <p className="text-gray-600">Zona {order.shipping_zone}</p>
              )}
              {order.shipping_neighborhood && (
                <p className="text-gray-600">{order.shipping_neighborhood}</p>
              )}
              <p className="text-gray-600">
                {order.shipping_city}, {order.shipping_department}
              </p>
              {order.shipping_additional_references && (
                <p className="text-gray-500 italic mt-2">
                  Ref: {order.shipping_additional_references}
                </p>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          {order.customer_notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-brand-black mb-2">Notas del Cliente</h2>
              <p className="text-sm text-gray-600">{order.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status as OrderStatus} />

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              Cliente
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.profiles?.full_name || 'Sin nombre'}</p>
              <p className="text-gray-600">{order.profiles?.email}</p>
              {order.profiles?.phone && (
                <p className="text-gray-600">{order.profiles.phone}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              Pago
            </h2>
            {order.payments?.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map((payment: any) => (
                  <div key={payment.id} className="text-sm">
                    <p className="font-medium">
                      {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                    </p>
                    <p className="text-gray-600">{formatPrice(Number(payment.amount))}</p>
                    <p className={`text-xs ${paymentStatusLabels[payment.status]?.className || 'text-gray-600'}`}>
                      {paymentStatusLabels[payment.status]?.label || payment.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Sin pagos registrados</p>
            )}
          </div>

          {/* Tracking Info */}
          {(order.tracking_number || order.status === 'shipped') && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-brand-black flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5" />
                Tracking
              </h2>
              {order.tracking_number ? (
                <div className="text-sm">
                  <p className="font-medium">{order.tracking_number}</p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Ver seguimiento →
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Sin número de tracking</p>
              )}
            </div>
          )}

          <AdminNotesEditor orderId={order.id} initialNotes={order.admin_notes || ''} />
        </div>
      </div>
    </div>
  );
}
