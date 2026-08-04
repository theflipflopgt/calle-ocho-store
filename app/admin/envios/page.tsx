import Link from 'next/link';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminShipmentsPage() {
  const auth = await requireAuthenticatedUser();
  if (!auth.isAdmin) return null;
  const db = createAdminClient() || auth.supabase;
  const { data } = await (db as any).from('shipments').select('id,carrier,status,tracking_number,created_at,orders:order_id(id,order_number,shipping_recipient_name)').order('created_at', { ascending: false });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-brand-black">Envíos</h1><p className="text-gray-600">Guías y entregas registradas.</p></div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Pedido</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Transportista</th><th className="p-3 text-left">Guía</th><th className="p-3 text-left">Estado</th></tr></thead>
          <tbody>{(data || []).map((shipment: any) => <tr key={shipment.id} className="border-t"><td className="p-3"><Link className="text-brand-blue hover:underline" href={`/admin/ordenes/${shipment.orders?.id}`}>{shipment.orders?.order_number}</Link></td><td className="p-3">{shipment.orders?.shipping_recipient_name}</td><td className="p-3">{shipment.carrier}</td><td className="p-3">{shipment.tracking_number || 'Sin guía'}</td><td className="p-3">{shipment.status}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
