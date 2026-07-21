'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/constants/business';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_street_address: string;
  shipping_zone: string | null;
  shipping_neighborhood: string | null;
  shipping_city: string;
  shipping_department: string;
  tracking_number: string | null;
  customer_notes: string | null;
  created_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items: {
    id: string;
    product_name: string;
    brand_name: string;
    color_name: string;
    size_us: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product_image_url: string | null;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  paid: { label: 'Pagado', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  processing: { label: 'En Proceso', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  shipped: { label: 'Enviado', color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  delivered: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-50' },
  refunded: { label: 'Reembolsado', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchOrder() {
      const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!user || !orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setOrder(data as OrderDetail);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [user, params.id, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 mb-4">Pedido no encontrado</p>
        <Button onClick={() => router.push('/cuenta/pedidos')}>
          Volver a mis pedidos
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/cuenta/pedidos"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-black"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis pedidos
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-black mb-2">
              Pedido {order.order_number}
            </h1>
            <p className="text-sm text-gray-500">
              Realizado el {new Date(order.created_at || new Date()).toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className={cn(
            "inline-flex items-center px-4 py-2 rounded-full font-medium text-sm",
            statusConfig.color,
            statusConfig.bgColor
          )}>
            {statusConfig.label}
          </div>
        </div>

        {/* Order Timeline */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <TimelineStep
              icon={<Clock className="w-5 h-5" />}
              label="Confirmado"
              date={order.created_at}
              isComplete={true}
            />
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <TimelineStep
              icon={<Package className="w-5 h-5" />}
              label="En Proceso"
              date={order.paid_at}
              isComplete={['processing', 'shipped', 'delivered'].includes(order.status)}
            />
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <TimelineStep
              icon={<Truck className="w-5 h-5" />}
              label="Enviado"
              date={order.shipped_at}
              isComplete={['shipped', 'delivered'].includes(order.status)}
            />
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <TimelineStep
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Entregado"
              date={order.delivered_at}
              isComplete={order.status === 'delivered'}
            />
          </div>
        </div>

        {/* Tracking */}
        {order.tracking_number && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Número de rastreo
            </p>
            <p className="font-mono text-blue-700">{order.tracking_number}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-brand-black mb-4">
          Productos ({order.items.length})
        </h2>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product_image_url ? (
                  <Image
                    src={item.product_image_url}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase">{item.brand_name}</p>
                <p className="font-medium text-brand-black line-clamp-2 mb-1">
                  {item.product_name}
                </p>
                <p className="text-sm text-gray-500">
                  {item.color_name} · Talla {item.size_us}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cantidad: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand-black">
                  {formatPrice(item.subtotal)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(item.unit_price)} c/u
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span>
              {order.shipping_cost === 0 ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                formatPrice(order.shipping_cost)
              )}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-brand-blue" />
          <h2 className="text-lg font-semibold text-brand-black">
            Dirección de Envío
          </h2>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-brand-black">{order.shipping_recipient_name}</p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {order.shipping_phone}
          </p>
          <p>{order.shipping_street_address}</p>
          {(order.shipping_zone || order.shipping_neighborhood) && (
            <p>{[order.shipping_zone, order.shipping_neighborhood].filter(Boolean).join(', ')}</p>
          )}
          <p>{order.shipping_city}, {order.shipping_department}</p>
        </div>
      </div>

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-black mb-2">
            Notas del Pedido
          </h2>
          <p className="text-sm text-gray-600">{order.customer_notes}</p>
        </div>
      )}

      {/* Help */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
        <p className="text-sm text-gray-600 mb-3">
          ¿Tienes alguna duda sobre tu pedido?
        </p>
        <Button variant="outline" asChild>
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contactar por WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

function TimelineStep({
  icon,
  label,
  date,
  isComplete,
}: {
  icon: React.ReactNode;
  label: string;
  date: string | null;
  isComplete: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2",
          isComplete
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-400"
        )}
      >
        {icon}
      </div>
      <span className={cn(
        "text-xs font-medium text-center",
        isComplete ? "text-brand-black" : "text-gray-400"
      )}>
        {label}
      </span>
      {date && (
        <span className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
          {new Date(date).toLocaleDateString('es-GT', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  );
}
