import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import { BadgeDollarSign, CalendarClock, Eye, Package, ReceiptText } from 'lucide-react';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { formatPrice } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { calculateSellerPerformance } from '@/lib/admin/seller-performance';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente de pago', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Procesando', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-700' },
};

function guatemalaMonthStart() {
  const nowInGuatemala = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      nowInGuatemala.getUTCFullYear(),
      nowInGuatemala.getUTCMonth(),
      1,
      6
    )
  ).toISOString();
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Sin fecha registrada';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

async function getSellerPerformance() {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) redirect('/auth/login');
  if (!auth.isSeller) redirect('/admin');

  const baseSelect = `
    id,
    order_number,
    created_at,
    seller_assigned_at,
    status,
    total,
    seller_commission_amount,
    shipping_recipient_name,
    shipping_phone,
    order_items (
      product_name,
      quantity
    )
  `;

  const [{ data: recentOrders, error: recentError }, { data: monthOrders, error: monthError }] =
    await Promise.all([
      auth.supabase
        .from('orders')
        .select(baseSelect)
        .eq('seller_id', auth.user.id)
        .order('seller_assigned_at', { ascending: false, nullsFirst: false })
        .limit(50),
      auth.supabase
        .from('orders')
        .select('id, status, total, seller_commission_amount, order_items(quantity)')
        .eq('seller_id', auth.user.id)
        .gte('seller_assigned_at', guatemalaMonthStart()),
    ]);

  if (recentError) console.error('Error fetching seller orders:', recentError);
  if (monthError) console.error('Error fetching seller month metrics:', monthError);

  return {
    orders: recentOrders || [],
    stats: calculateSellerPerformance(monthOrders || []),
  };
}

export default async function SellerPerformancePage() {
  const { orders, stats } = await getSellerPerformance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Mi rendimiento</h1>
        <p className="mt-1 text-gray-600">
          Pedidos asignados, ventas y comisiones del mes actual.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={ReceiptText} label="Pedidos asignados" value={String(stats.assigned)} />
        <Metric icon={Package} label="Pares vendidos" value={String(stats.pairs)} />
        <Metric icon={BadgeDollarSign} label="Ventas" value={formatPrice(stats.sales)} />
        <Metric icon={CalendarClock} label="Comisión" value={formatPrice(stats.commission)} />
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-brand-black">Pedidos asignados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Últimos 50 pedidos bajo tu responsabilidad.
            </p>
          </div>
          <Link href="/admin/ordenes" className="text-sm font-medium text-brand-blue hover:underline">
            Ver todos
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p>Todavía no tienes pedidos asignados.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {orders.map((order: any) => (
                <SellerOrderCard key={order.id} order={order} />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="px-6 py-3 font-medium">Pedido</th>
                    <th className="px-6 py-3 font-medium">Asignado</th>
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Pares</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 text-right font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order: any) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const pairs = (order.order_items || []).reduce(
                      (sum: number, item: any) => sum + Number(item.quantity || 0),
                      0
                    );

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/ordenes/${order.id}`}
                            className="font-semibold text-brand-blue hover:underline"
                          >
                            #{order.order_number}
                          </Link>
                          <p className="mt-1 text-xs text-gray-500">
                            Creado {formatDate(order.created_at)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {formatDate(order.seller_assigned_at || order.created_at, true)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-brand-black">{order.shipping_recipient_name}</p>
                          <p className="text-sm text-gray-500">{order.shipping_phone}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{pairs}</td>
                        <td className="px-6 py-4 font-semibold text-brand-black">
                          {formatPrice(Number(order.total || 0))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/ordenes/${order.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label={`Ver pedido ${order.order_number}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-brand-blue" />
      <p className="text-xl font-bold text-brand-black">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function SellerOrderCard({ order }: { order: any }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const pairs = (order.order_items || []).reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <Link href={`/admin/ordenes/${order.id}`} className="block p-4 active:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-brand-blue">#{order.order_number}</p>
          <p className="mt-1 truncate text-sm font-medium text-brand-black">
            {order.shipping_recipient_name}
          </p>
          <p className="text-xs text-gray-500">
            Asignado {formatDate(order.seller_assigned_at || order.created_at, true)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-brand-black">{formatPrice(Number(order.total || 0))}</p>
          <p className="text-xs text-gray-500">{pairs} {pairs === 1 ? 'par' : 'pares'}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        <span className="text-xs font-medium text-brand-blue">Ver pedido</span>
      </div>
    </Link>
  );
}
