import Link from 'next/link';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReturnStatusEditor } from './return-status-editor';

export default async function AdminReturnsPage() {
  const auth = await requireAuthenticatedUser();
  if (!auth.isAdmin) return null;
  const db = createAdminClient() || auth.supabase;
  const { data } = await (db as any).from('return_requests').select('id,request_type,status,reason,created_at,orders:order_id(id,order_number,shipping_recipient_name)').order('created_at', { ascending: false });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-brand-black">Cambios y devoluciones</h1><p className="text-gray-600">Solicitudes recibidas de clientes.</p></div>
      <div className="space-y-3">{(data || []).map((item: any) => <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><Link href={`/admin/ordenes/${item.orders?.id}`} className="font-semibold text-brand-blue hover:underline">{item.orders?.order_number}</Link><p className="text-sm text-gray-600">{item.orders?.shipping_recipient_name} · {item.request_type}</p><p className="mt-2 text-sm text-gray-700">{item.reason}</p></div><ReturnStatusEditor id={item.id} status={item.status} /></div></article>)}</div>
    </div>
  );
}
