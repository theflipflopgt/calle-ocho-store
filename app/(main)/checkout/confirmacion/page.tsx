'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Package, Truck, Phone, MapPin, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/constants/business';

interface OrderData {
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
  tracking_url: string | null;
  created_at: string | null;
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

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const accessToken = searchParams.get('token');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setError('Falta el número de pedido');
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({ order: orderNumber });
        if (accessToken) params.set('token', accessToken);

        const response = await fetch(`/api/orders/lookup?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || 'No se pudo cargar la información del pedido');
        }

        setOrder(result.order as OrderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la información del pedido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber, accessToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">{error || 'Pedido no encontrado'}</p>
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-black mb-2">
          ¡Pedido confirmado!
        </h1>
        <p className="text-gray-600">
          Gracias por tu compra. Te enviaremos un correo con los detalles.
        </p>
      </div>

      {/* Order Number */}
      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 sm:p-6 mb-6 text-center">
        <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
        <p className="text-xl sm:text-2xl font-bold text-brand-black">
          {order.order_number}
        </p>
      </div>

      {order.tracking_number && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-6 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-1">Número de rastreo</p>
          <p className="font-mono text-blue-700">{order.tracking_number}</p>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-brand-blue hover:underline"
            >
              Ver seguimiento
            </a>
          )}
        </div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-brand-black mb-4">
          Estado del pedido
        </h2>
        <div className="flex items-center justify-between">
          <OrderStep
            icon={<Package className="w-5 h-5" />}
            label="Confirmado"
            isActive={true}
            isComplete={true}
          />
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <OrderStep
            icon={<Truck className="w-5 h-5" />}
            label="En camino"
            isActive={false}
            isComplete={false}
          />
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <OrderStep
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Entregado"
            isActive={false}
            isComplete={false}
          />
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-brand-blue" />
            <h3 className="font-semibold text-brand-black">Dirección de Envío</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-brand-black">{order.shipping_recipient_name}</p>
            <p>{order.shipping_street_address}</p>
            <p>
              {[order.shipping_zone, order.shipping_neighborhood].filter(Boolean).join(', ')}
            </p>
            <p>{order.shipping_city}, {order.shipping_department}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-brand-blue" />
            <h3 className="font-semibold text-brand-black">Contacto</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>{order.shipping_phone}</p>
            <p className="text-xs text-gray-500">
              Te contactaremos para coordinar la entrega y el pago.
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-brand-blue" />
          <h3 className="font-semibold text-brand-black">
            Productos ({order.items.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                <p className="text-sm font-medium text-brand-black line-clamp-1">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.color_name} · Talla {item.size_us} · Cant: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-brand-black">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 h-12 bg-brand-black hover:bg-gray-800"
          asChild
        >
          <Link href="/seguimiento">
            Consultar seguimiento
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12"
          asChild
        >
          <Link href="/">
            Seguir comprando
          </Link>
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          ¿Tienes preguntas? Contáctanos por{' '}
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue hover:underline"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}

function OrderStep({
  icon,
  label,
  isActive,
  isComplete,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
          isComplete
            ? "bg-green-500 text-white"
            : isActive
              ? "bg-brand-blue text-white"
              : "bg-gray-100 text-gray-400"
        )}
      >
        {icon}
      </div>
      <span className={cn(
        "text-xs mt-2",
        isActive || isComplete ? "text-brand-black font-medium" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <main className="container mx-auto px-4 py-8 sm:py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      }>
        <ConfirmacionContent />
      </Suspense>
    </main>
  );
}
