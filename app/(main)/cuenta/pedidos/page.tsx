'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string | null;
  items: {
    id: string;
    product_name: string;
    product_image_url: string | null;
    quantity: number;
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

export default function PedidosPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            total,
            created_at,
            items:order_items(
              id,
              product_name,
              product_image_url,
              quantity
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-brand-black mb-2">
          No tienes pedidos
        </h2>
        <p className="text-gray-500 mb-6">
          Cuando realices tu primera compra, aparecerá aquí
        </p>
        <Button asChild>
          <Link href="/hombre">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Explorar productos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-brand-black">
          Mis Pedidos ({orders.length})
        </h2>
      </div>

      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const firstThreeItems = order.items.slice(0, 3);
  const remainingCount = order.items.length - 3;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-brand-black">
                {order.order_number}
              </h3>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                statusConfig.color,
                statusConfig.bgColor
              )}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at || new Date()).toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-brand-black">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Products Preview */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          {firstThreeItems.map((item, index) => (
            <div
              key={item.id}
              className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
            >
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
              {item.quantity > 1 && (
                <div className="absolute top-1 right-1 bg-brand-black text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.quantity}
                </div>
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>

        <Link href={`/cuenta/pedidos/${order.id}`}>
          <Button
            variant="outline"
            className="w-full justify-between h-11"
          >
            Ver detalles del pedido
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
