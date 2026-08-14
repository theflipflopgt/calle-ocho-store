import Link from 'next/link';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { formatPrice } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { ReturnStatusEditor } from './return-status-editor';
import { createManualReturnRequest } from './actions';

const typeLabels: Record<string, string> = {
  size_exchange: 'Cambio de talla',
  return: 'Devolución',
  damaged_item: 'Producto dañado',
  wrong_item: 'Producto incorrecto',
};

const createErrors: Record<string, string> = {
  invalid: 'Completa el número de pedido, el tipo y un motivo de al menos 5 caracteres.',
  order: 'No se encontró ese número de pedido.',
  duplicate: 'Ese pedido ya tiene una gestión abierta.',
  save: 'No se pudo crear la gestión. Intenta nuevamente.',
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

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; createError?: string; created?: string; orderNumber?: string }>;
}) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return null;

  const params = await searchParams;
  const query = String(params.q || '').trim().toLowerCase();
  const statusFilter = String(params.status || 'all');
  const { data, error } = await (auth.supabase as any).rpc('admin_list_return_requests');

  if (error) console.error('Error fetching return requests:', error);

  const requests = Array.isArray(data) ? data : [];
  const filtered = requests.filter((item: any) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!query) return true;
    const order = item.orders;
    return [
      order?.order_number,
      order?.shipping_recipient_name,
      order?.guest_email,
      order?.shipping_phone,
      order?.customer?.full_name,
      order?.customer?.email,
      order?.customer?.phone,
    ]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Cambios y devoluciones</h1>
        <p className="mt-1 text-gray-600">Abre y da seguimiento a cada gestión ligada a su pedido y pago.</p>
      </div>

      {params.created === '1' && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Gestión creada correctamente.
        </div>
      )}
      {params.createError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {createErrors[params.createError] || createErrors.save}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          No se pudieron consultar las gestiones en Supabase. Confirma que la última migración esté ejecutada.
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-brand-blue" />
          <div>
            <h2 className="font-semibold text-brand-black">Nueva gestión manual</h2>
            <p className="text-sm text-gray-600">Busca el pedido exacto; el cliente y el pago se enlazan automáticamente.</p>
          </div>
        </div>
        <form action={createManualReturnRequest} className="grid gap-4 lg:grid-cols-[180px_220px_1fr_auto] lg:items-end">
          <label className="text-sm font-medium text-gray-700">
            Número de pedido
            <input name="orderNumber" defaultValue={params.orderNumber || ''} placeholder="CO-2026..." required className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Tipo de gestión
            <select name="requestType" className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal">
              <option value="size_exchange">Cambio de talla</option>
              <option value="return">Devolución</option>
              <option value="damaged_item">Producto dañado</option>
              <option value="wrong_item">Producto incorrecto</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Motivo y detalle
            <input name="reason" minLength={5} required placeholder="Ej. solicita cambiar talla 8 por talla 9" className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 font-normal" />
          </label>
          <Button type="submit" className="h-10">Crear gestión</Button>
        </form>
      </section>

      <form className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_190px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={params.q || ''} placeholder="Pedido, cliente, correo o teléfono" className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm" />
        </label>
        <select name="status" defaultValue={statusFilter} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="all">Todos los estados</option>
          <option value="requested">Solicitadas</option>
          <option value="approved">Aprobadas</option>
          <option value="received">Recibidas</option>
          <option value="completed">Completadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <div className="space-y-4">
        {filtered.length === 0 && !error ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
            No hay gestiones que coincidan con la búsqueda.
          </div>
        ) : filtered.map((item: any) => {
          const order = item.orders;
          const payment = [...(order?.payments || [])].sort((a: any, b: any) =>
            String(b.created_at).localeCompare(String(a.created_at))
          )[0];
          const reference = payment?.provider_reference || payment?.transaction_id;

          return (
            <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/ordenes/${order?.id}`} className="text-lg font-semibold text-brand-blue hover:underline">
                        #{order?.order_number}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {order?.shipping_recipient_name} · {order?.guest_email || order?.customer?.email || order?.shipping_phone}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{formatDate(item.created_at)}</p>
                      <p className="font-semibold text-brand-black">{typeLabels[item.request_type] || item.request_type}</p>
                    </div>
                  </div>

                  <div className="rounded-md bg-gray-50 px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900">Motivo</p>
                    <p className="mt-1 text-gray-700">{item.reason}</p>
                  </div>

                  {item.request_type === 'size_exchange' && !['completed', 'cancelled', 'rejected'].includes(item.status) && (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      Esta gestión no cambia existencias automáticamente. Verifica recepción, talla devuelta y talla destino antes de completarla.
                    </div>
                  )}

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-gray-500">Total del pedido</p>
                      <p className="font-semibold">{formatPrice(Number(order?.total || 0))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pago / transacción</p>
                      {payment ? (
                        <p className="font-medium">{payment.payment_method} · {payment.status} · {formatPrice(Number(payment.amount || 0))}{reference ? ` · ${reference}` : ''}</p>
                      ) : <p className="text-gray-600">Sin pago registrado</p>}
                    </div>
                  </div>
                </div>

                <ReturnStatusEditor id={item.id} status={item.status} resolutionNotes={item.resolution_notes || ''} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
