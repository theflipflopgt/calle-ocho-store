import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, Search, Filter, Package, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/currency';

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

async function getOrders(filters: { status?: string; q?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles:user_id (full_name, email, phone),
      order_items (
        id,
        product_name,
        quantity,
        unit_price
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.q) {
    query = query.or(`order_number.ilike.%${filters.q}%,shipping_recipient_name.ilike.%${filters.q}%`);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return orders;
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

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const filters = await searchParams;
  const orders = await getOrders(filters);

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    processing: orders.filter((o: any) => ['paid', 'processing'].includes(o.status)).length,
    shipped: orders.filter((o: any) => o.status === 'shipped').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Órdenes</h1>
        <p className="text-gray-600 mt-1">Gestiona los pedidos de la tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.processing}</p>
              <p className="text-sm text-gray-600">Por enviar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-black">{stats.shipped}</p>
              <p className="text-sm text-gray-600">En camino</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                name="q"
                placeholder="Buscar por # de orden o nombre..."
                defaultValue={filters.q}
                className="pl-10"
              />
            </div>
          </div>

          <select
            name="status"
            defaultValue={filters.status}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="processing">Procesando</option>
            <option value="shipped">Enviados</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </form>
      </div>

      {/* Orders - Mobile Cards */}
      <div className="md:hidden space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No hay órdenes {filters.status ? `con estado "${statusConfig[filters.status]?.label}"` : ''}</p>
          </div>
        ) : (
          orders.map((order: any) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

            return (
              <Link
                key={order.id}
                href={`/admin/ordenes/${order.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-blue">#{order.order_number}</p>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.class}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-brand-black mt-1 truncate">
                      {order.shipping_recipient_name || order.profiles?.full_name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.profiles?.email}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-brand-black">
                      {formatPrice(Number(order.total))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-GT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <span className="text-xs text-brand-blue font-medium">Ver detalles →</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay órdenes {filters.status ? `con estado "${statusConfig[filters.status]?.label}"` : ''}</p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/ordenes/${order.id}`}
                          className="font-medium text-brand-blue hover:underline"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-brand-black">
                            {order.shipping_recipient_name || order.profiles?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.profiles?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-black">
                          {formatPrice(Number(order.total))}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.class}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('es-GT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <Link href={`/admin/ordenes/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
