import { Activity, Search } from 'lucide-react';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';

const actionLabels: Record<string, string> = {
  insert: 'Creó',
  update: 'Actualizó',
  delete: 'Eliminó',
};

const entityLabels: Record<string, string> = {
  products: 'Producto',
  product_variants: 'Variante / talla',
  inventory_movements: 'Movimiento de inventario',
  orders: 'Pedido',
  shipments: 'Envío',
  return_requests: 'Cambio o devolución',
  seller_commission_rules: 'Regla de comisión',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string; action?: string }>;
}) {
  const auth = await requireAuthenticatedUser();
  if (!auth.isAdmin) return null;

  const params = await searchParams;
  const query = String(params.q || '').trim().toLowerCase();
  const entityFilter = String(params.entity || 'all');
  const actionFilter = String(params.action || 'all');
  const db = (createAdminClient() || auth.supabase) as any;

  let request = db
    .from('admin_activity_logs')
    .select('id,actor_role,action,entity_type,entity_id,changed_fields,created_at,actor:actor_id(full_name,email)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (entityFilter !== 'all') request = request.eq('entity_type', entityFilter);
  if (actionFilter !== 'all') request = request.eq('action', actionFilter);

  const { data, error } = await request;
  if (error) console.error('Error fetching audit log:', error);

  const rows = (data || []).filter((row: any) => {
    if (!query) return true;
    return [row.actor?.full_name, row.actor?.email, row.entity_id, ...(row.changed_fields || [])]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Auditoría de operaciones</h1>
        <p className="mt-1 text-gray-600">Últimos 200 cambios realizados por administradores, vendedores y bodega.</p>
      </div>

      <form className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[1fr_220px_160px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={params.q || ''} placeholder="Usuario, campo o ID" className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm" />
        </label>
        <select name="entity" defaultValue={entityFilter} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="all">Todas las áreas</option>
          {Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="action" defaultValue={actionFilter} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="all">Todas las acciones</option>
          <option value="insert">Creó</option>
          <option value="update">Actualizó</option>
          <option value="delete">Eliminó</option>
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center text-gray-500">
            <Activity className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            Aún no hay operaciones registradas con estos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Fecha</th>
                  <th className="px-5 py-3 text-left font-medium">Usuario</th>
                  <th className="px-5 py-3 text-left font-medium">Acción</th>
                  <th className="px-5 py-3 text-left font-medium">Área</th>
                  <th className="px-5 py-3 text-left font-medium">Campos</th>
                  <th className="px-5 py-3 text-left font-medium">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row: any) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(row.created_at)}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-brand-black">{row.actor?.full_name || row.actor?.email || 'Usuario eliminado'}</p>
                      <p className="text-xs capitalize text-gray-500">{row.actor_role}</p>
                    </td>
                    <td className="px-5 py-4 font-medium">{actionLabels[row.action] || row.action}</td>
                    <td className="px-5 py-4">{entityLabels[row.entity_type] || row.entity_type}</td>
                    <td className="px-5 py-4 text-gray-600">{(row.changed_fields || []).join(', ')}</td>
                    <td className="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-gray-500" title={row.entity_id || ''}>{row.entity_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-xs text-gray-500">El historial registra cambios, no consultas. La retención recomendada es de 365 días.</p>
    </div>
  );
}
