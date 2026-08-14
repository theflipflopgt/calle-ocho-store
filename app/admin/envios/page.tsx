import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, Package, Truck } from 'lucide-react';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';

const shipmentStatus: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  ready: { label: 'Listo', className: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800' },
  in_transit: { label: 'En tránsito', className: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  exception: { label: 'Incidencia', className: 'bg-red-100 text-red-800' },
  returned: { label: 'Retornado', className: 'bg-orange-100 text-orange-800' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function AdminShipmentsPage() {
  const auth = await requireAuthenticatedUser();
  if (!auth.isAdmin && !auth.isWarehouse) return null;
  const db = (createAdminClient() || auth.supabase) as any;

  const [{ data: shipments, error: shipmentError }, { data: candidateOrders, error: ordersError }] =
    await Promise.all([
      db
        .from('shipments')
        .select(`
          id, carrier, service, status, tracking_number, shipping_cost,
          created_at, shipped_at, delivered_at,
          orders:order_id(
            id, order_number, status, total, created_at,
            shipping_recipient_name, shipping_city, shipping_department
          )
        `)
        .order('created_at', { ascending: false }),
      db
        .from('orders')
        .select(`
          id, order_number, status, total, created_at,
          shipping_recipient_name, shipping_city, shipping_department,
          shipments(id, status)
        `)
        .in('status', ['paid', 'processing', 'shipped'])
        .order('created_at', { ascending: true }),
    ]);

  if (shipmentError) console.error('Error fetching shipments:', shipmentError);
  if (ordersError) console.error('Error fetching shipment queue:', ordersError);

  const queue = (candidateOrders || []).filter((order: any) => !order.shipments?.length);
  const activeShipments = (shipments || []).filter(
    (shipment: any) => !['delivered', 'cancelled', 'returned'].includes(shipment.status)
  );
  const incidents = (shipments || []).filter((shipment: any) => shipment.status === 'exception');
  const delivered = (shipments || []).filter((shipment: any) => shipment.status === 'delivered');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Envíos</h1>
        <p className="mt-1 text-gray-600">
          Pedidos pendientes de preparar, guías activas y entregas registradas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ShipmentMetric icon={Package} label="Por preparar" value={queue.length} />
        <ShipmentMetric icon={Truck} label="En curso" value={activeShipments.length} />
        <ShipmentMetric icon={AlertTriangle} label="Incidencias" value={incidents.length} />
        <ShipmentMetric icon={CheckCircle} label="Entregados" value={delivered.length} />
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-brand-black">Pedidos por preparar</h2>
          <p className="mt-1 text-sm text-gray-600">
            Pedidos pagados o en proceso que todavía no tienen registro de envío.
          </p>
        </div>
        {queue.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
            No hay pedidos pendientes de preparar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Pedido</th>
                  <th className="px-5 py-3 text-left font-medium">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium">Destino</th>
                  <th className="px-5 py-3 text-left font-medium">Fecha</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4 font-semibold text-brand-blue">#{order.order_number}</td>
                    <td className="px-5 py-4">{order.shipping_recipient_name}</td>
                    <td className="px-5 py-4 text-gray-600">{order.shipping_city}, {order.shipping_department}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatPrice(Number(order.total || 0))}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/ordenes/${order.id}`}>
                        <Button size="sm">Preparar envío</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-brand-black">Guías y entregas</h2>
          <p className="mt-1 text-sm text-gray-600">Historial de envíos creados desde cada pedido.</p>
        </div>
        {(shipments || []).length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            Todavía no se ha creado ninguna guía. Usa “Preparar envío” en la cola superior.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Pedido</th>
                  <th className="px-5 py-3 text-left font-medium">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium">Transportista</th>
                  <th className="px-5 py-3 text-left font-medium">Guía</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-left font-medium">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(shipments || []).map((shipment: any) => {
                  const status = shipmentStatus[shipment.status] || shipmentStatus.pending;
                  return (
                    <tr key={shipment.id}>
                      <td className="px-5 py-4">
                        <Link className="font-semibold text-brand-blue hover:underline" href={`/admin/ordenes/${shipment.orders?.id}`}>
                          #{shipment.orders?.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">{shipment.orders?.shipping_recipient_name}</td>
                      <td className="px-5 py-4">{shipment.carrier}{shipment.service ? ` · ${shipment.service}` : ''}</td>
                      <td className="px-5 py-4">{shipment.tracking_number || 'Sin guía'}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(shipment.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ShipmentMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-brand-blue" />
      <p className="text-2xl font-bold text-brand-black">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
