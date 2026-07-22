'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, PackageCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils/currency';

interface TrackedOrder {
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_recipient_name: string;
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
    subtotal: number;
  }[];
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export function TrackingForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo consultar el pedido.');
      }

      setOrder(result.order as TrackedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-3">
          <PackageCheck className="h-5 w-5 text-brand-blue" />
          <h2 className="font-semibold text-brand-black">Consultar pedido</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="orderNumber">Número de pedido</Label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="TFF-20260722020526-CAC8"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact">Correo o teléfono</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="correo@ejemplo.com o 5555-1234"
              className="mt-1"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="mt-5 h-11 w-full bg-brand-black hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Consultar
        </Button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        {!order ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-gray-500">
            <Truck className="mb-3 h-8 w-8 text-gray-300" />
            <p>Ingresa tus datos para ver el estado del pedido.</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedido</p>
                <h3 className="text-xl font-bold text-brand-black">{order.order_number}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(order.created_at || Date.now()).toLocaleDateString('es-GT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            {order.tracking_number && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Número de rastreo</p>
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

            <div className="mt-4">
              <p className="font-semibold text-brand-black">Entrega</p>
              <p className="mt-1 text-sm text-gray-600">
                {order.shipping_recipient_name}, {order.shipping_city}, {order.shipping_department}
              </p>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-black">{item.product_name}</p>
                      <p className="text-gray-500">
                        {item.brand_name} · {item.color_name} · Talla {item.size_us} · Cant: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span>{order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/contacto">Necesito ayuda</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
